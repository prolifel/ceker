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

export async function createDomain(domainName: string): Promise<Domain | null> {
    try {
        const [res] = await pool.execute<ResultSetHeader>(
            `insert into domains(domain) values (?)`,
            [domainName]
        )

        return {
            id: res.insertId,
            domain: domainName
        }
    } catch (error) {
        console.error(error)
        return null
    }
}