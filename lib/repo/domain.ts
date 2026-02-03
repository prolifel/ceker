import { pool } from '@/lib/shared/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

export interface DomainRow extends RowDataPacket {
    domain: string
    id: number
}
export interface Domain {
    domain: string
    id: number
}

export type CreateDomainResult =
    | { ok: true; data: Domain }
    | { ok: false; error: 'DUPLICATE_DOMAIN' | 'UNKNOWN_ERROR' };

export type BulkCreateDomainResult = {
    ok: true
    failed: string[]
};

interface MySQLError extends Error {
    code?: string;
    sqlMessage?: string;
}

export async function getDomainByDomain(query: string): Promise<Domain | null> {
    try {
        const [rows] = await pool.query<DomainRow[]>(
            `select id, domain from domains where domain = ?`,
            [query]
        )

        return rows.length > 0 ? rows[0] : null
    } catch (error) {
        console.error(error);
        return null
    }
}

export async function getAllDomains(): Promise<Domain[]> {
    try {
        const [rows] = await pool.query<DomainRow[]>(
            `select domain, id from domains`
        )

        return rows
    } catch (error) {
        console.error(error)
        return []
    }
}

export async function createDomain(domainName: string): Promise<CreateDomainResult> {
    try {
        const [res] = await pool.execute<ResultSetHeader>(
            `insert into domains(domain) values (?)`,
            [domainName]
        )

        return {
            ok: true,
            data: {
                id: res.insertId,
                domain: domainName
            }
        }
    } catch (error) {
        const err = error as MySQLError
        if (err.code === 'ER_DUP_ENTRY') {
            return { ok: false, error: "DUPLICATE_DOMAIN" }
        }

        console.error(error)
        return { ok: false, error: "UNKNOWN_ERROR" }
    }
}

export async function createDomains(domainNames: string[]): Promise<BulkCreateDomainResult> {
    if (domainNames.length === 0) {
        return { ok: true, failed: [] }
    }

    try {
        // Filter out empty strings
        const validDomains = domainNames.filter(d => d && d.trim().length > 0)

        if (validDomains.length === 0) {
            return { ok: true, failed: [] }
        }

        // Get existing domains to identify duplicates
        const [existingRows] = await pool.query<DomainRow[]>(
            `select domain from domains where domain in (?)`,
            [validDomains]
        )

        const existingDomains = new Set(existingRows.map(row => row.domain))
        const newDomains = validDomains.filter(d => !existingDomains.has(d))

        // Insert only new domains
        if (newDomains.length > 0) {
            const values = newDomains.map(() => '(?)').join(',')
            await pool.execute(
                `insert into domains(domain) values ${values}`,
                newDomains
            )
        }

        return {
            ok: true,
            failed: validDomains.filter(d => existingDomains.has(d))
        }
    } catch (error) {
        console.error(error)
        // On any error, return all domains as failed to be safe
        return { ok: true, failed: domainNames }
    }
}