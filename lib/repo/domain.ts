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