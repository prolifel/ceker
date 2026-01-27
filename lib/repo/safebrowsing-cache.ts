import { pool } from '@/lib/shared/db';
import { RowDataPacket } from 'mysql2';

export interface SafeBrowsingGlobalCacheRow extends RowDataPacket {
    id: number
    hash: string
    created_at: Date
}

export async function isHashInGlobalCache(hash: string): Promise<boolean> {
    try {
        const [rows] = await pool.query<SafeBrowsingGlobalCacheRow[]>(
            `SELECT 1 FROM safebrowsing_global_cache WHERE hash = ? LIMIT 1`,
            [hash]
        )
        return rows.length > 0
    } catch (error) {
        console.error('Global cache lookup error:', error)
        return false
    }
}

export async function addHashToGlobalCache(hash: string): Promise<void> {
    try {
        await pool.query(
            `INSERT IGNORE INTO safebrowsing_global_cache (hash) VALUES (?)`,
            [hash]
        )
    } catch (error) {
        console.error('Global cache insert error:', error)
    }
}

export async function addHashesToGlobalCache(hashes: string[]): Promise<void> {
    if (hashes.length === 0) return

    try {
        const values = hashes.map(() => '(?)').join(',')
        await pool.query(
            `INSERT IGNORE INTO safebrowsing_global_cache (hash) VALUES ${values}`,
            hashes
        )
    } catch (error) {
        console.error('Global cache bulk insert error:', error)
    }
}
