import { pool } from '@/lib/shared/db';
import { RowDataPacket } from 'mysql2';

import { prisma } from "../prisma"

export interface Domain extends RowDataPacket {
    domain: string
    id: number
}

export async function getDomains(query: string | null) {
    return await prisma.domain.findFirst(
        query ? { where: { domain: query } } : undefined
    )
}

export async function getDomainByDomain(query: string): Promise<Domain | null> {
    try {
        const [rows] = await pool.query<Domain[]>(
            `select domain from domains where domain = ?`,
            [query]
        )

        return rows.length > 0 ? rows[0] : null
    } catch (error) {
        console.error(error);
        return null
    }
}