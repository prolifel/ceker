import { pool } from '@/lib/shared/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

export interface BlacklistRow extends RowDataPacket {
    id: number;
    domain: string;
    created_at: Date;
}

export interface Blacklist {
    domain: string;
    id: number;
    created_at: Date;
}

export type CreateBlacklistResult =
    | { ok: true; data: Blacklist }
    | { ok: false; error: 'DUPLICATE_DOMAIN' | 'UNKNOWN_ERROR' };

interface MySQLError extends Error {
    code?: string;
}

// Check if domain is in blacklist
export async function getBlacklistByDomain(domain: string): Promise<Blacklist | null> {
    try {
        const [rows] = await pool.query<BlacklistRow[]>(
            `select id, domain, created_at from blacklists where domain = ?`,
            [domain]
        );
        return rows.length > 0 ? rows[0] : null;
    } catch (error) {
        console.error(error);
        return null;
    }
}

// Create single blacklist entry
export async function createBlacklist(domain: string): Promise<CreateBlacklistResult> {
    try {
        const [res] = await pool.execute<ResultSetHeader>(
            `insert into blacklists(domain) values (?)`,
            [domain]
        );
        return {
            ok: true,
            data: {
                id: res.insertId,
                domain,
                created_at: new Date()
            }
        };
    } catch (error) {
        const err = error as MySQLError;
        if (err.code === 'ER_DUP_ENTRY') {
            return { ok: false, error: "DUPLICATE_DOMAIN" };
        }
        console.error(error);
        return { ok: false, error: "UNKNOWN_ERROR" };
    }
}

// Bulk create blacklist entries
export async function createBlacklists(domains: string[]): Promise<{ ok: true; inserted: number; duplicates: number }> {
    // Filter, dedupe, and insert in batches
    const validDomains = domains
        .filter(d => d && d.trim().length > 0)
        .map(d => d.trim().toLowerCase())
        .filter(d => /^[a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$/.test(d));

    const uniqueDomains = [...new Set(validDomains)];

    if (uniqueDomains.length === 0) {
        return { ok: true, inserted: 0, duplicates: 0 };
    }

    // Get existing
    const [existingRows] = await pool.query<BlacklistRow[]>(
        `select domain from blacklists where domain in (?)`,
        [uniqueDomains]
    );
    const existing = new Set(existingRows.map(r => r.domain));
    const newDomains = uniqueDomains.filter(d => !existing.has(d));

    // Insert in batches
    let inserted = 0;
    const batchSize = 500;
    for (let i = 0; i < newDomains.length; i += batchSize) {
        const batch = newDomains.slice(i, i + batchSize);
        const values = batch.map(() => '(?)').join(',');
        await pool.query(
            `insert into blacklists(domain) values ${values}`,
            batch
        );
        inserted += batch.length;
    }

    return {
        ok: true,
        inserted,
        duplicates: uniqueDomains.length - newDomains.length
    };
}
