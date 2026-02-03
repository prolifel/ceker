import { pool } from '@/lib/shared/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

export interface TLDRow extends RowDataPacket {
    tld: string
    id: number
    created_at: Date
}

export interface TLD {
    tld: string
    id: number
    created_at: Date
}

export type CreateTLDResult =
    | { ok: true; data: TLD }
    | { ok: false; error: 'DUPLICATE_TLD' | 'UNKNOWN_ERROR' };

interface MySQLError extends Error {
    code?: string;
    sqlMessage?: string;
}

export async function getTLD(tld: string): Promise<TLD | null> {
    try {
        const [rows] = await pool.query<TLDRow[]>(
            `select id, tld, created_at from tlds where tld = ?`,
            [tld]
        )

        return rows.length > 0 ? rows[0] : null
    } catch (error) {
        console.error(error);
        return null
    }
}

export async function getAllTLDs(): Promise<TLD[]> {
    try {
        const [rows] = await pool.query<TLDRow[]>(
            `select tld, id, created_at from tlds`
        )

        return rows
    } catch (error) {
        console.error(error)
        return []
    }
}

export async function createTLD(tld: string): Promise<CreateTLDResult> {
    try {
        const [res] = await pool.execute<ResultSetHeader>(
            `insert into tlds(tld) values (?)`,
            [tld]
        )

        return {
            ok: true,
            data: {
                id: res.insertId,
                tld: tld,
                created_at: new Date()
            }
        }
    } catch (error) {
        const err = error as MySQLError
        if (err.code === 'ER_DUP_ENTRY') {
            return { ok: false, error: "DUPLICATE_TLD" }
        }

        console.error(error)
        return { ok: false, error: "UNKNOWN_ERROR" }
    }
}

export async function createTLDs(tlds: string[]): Promise<{ ok: true; inserted: number; duplicates: number }> {
    if (tlds.length === 0) {
        return { ok: true, inserted: 0, duplicates: 0 }
    }

    try {
        // Filter out empty strings and normalize to lowercase
        const validTLDs = tlds.filter(t => t && t.trim().length > 0).map(t => t.trim().toLowerCase())

        // Remove duplicates
        const uniqueTLDs = [...new Set(validTLDs)]

        if (uniqueTLDs.length === 0) {
            return { ok: true, inserted: 0, duplicates: 0 }
        }

        // Get existing TLDs to identify duplicates
        const [existingRows] = await pool.query<TLDRow[]>(
            `select tld from tlds where tld in (?)`,
            [uniqueTLDs]
        )

        const existingTLDs = new Set(existingRows.map(row => row.tld))
        const newTLDs = uniqueTLDs.filter(t => !existingTLDs.has(t))

        // Insert only new TLDs in batches
        let inserted = 0
        if (newTLDs.length > 0) {
            const batchSize = 500
            for (let i = 0; i < newTLDs.length; i += batchSize) {
                const batch = newTLDs.slice(i, i + batchSize)
                const values = batch.map(() => '(?)').join(',')
                await pool.execute(
                    `insert into tlds(tld) values ${values}`,
                    batch
                )
                inserted += batch.length
            }
        }

        return {
            ok: true,
            inserted,
            duplicates: uniqueTLDs.length - newTLDs.length
        }
    } catch (error) {
        console.error(error)
        return { ok: true, inserted: 0, duplicates: 0 }
    }
}
