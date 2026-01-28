import { pool } from '@/lib/shared/db';
import { RowDataPacket } from 'mysql2';

export interface SafeBrowsingGlobalCacheRow extends RowDataPacket {
    id: number
    hash: string
    screenshot_path?: string | null
    verdict?: string | null
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

export async function getScreenshotPathByHash(hash: string): Promise<string | null> {
    try {
        const [rows] = await pool.query<SafeBrowsingGlobalCacheRow[]>(
            `SELECT screenshot_path FROM safebrowsing_global_cache WHERE hash = ? LIMIT 1`,
            [hash]
        )
        return rows.length > 0 ? rows[0].screenshot_path || null : null
    } catch (error) {
        console.error('Get screenshot path error:', error)
        return null
    }
}

export async function updateScreenshotPath(hash: string, screenshotPath: string): Promise<boolean> {
    try {
        await pool.query(
            `UPDATE safebrowsing_global_cache SET screenshot_path = ? WHERE hash = ?`,
            [screenshotPath, hash]
        )
        return true
    } catch (error) {
        console.error('Update screenshot path error:', error)
        return false
    }
}

export async function getVerdictByHash(hash: string): Promise<string | null> {
    try {
        const [rows] = await pool.query<SafeBrowsingGlobalCacheRow[]>(
            `SELECT verdict FROM safebrowsing_global_cache WHERE hash = ? LIMIT 1`,
            [hash]
        )
        return rows.length > 0 ? rows[0].verdict || null : null
    } catch (error) {
        console.error('Get verdict error:', error)
        return null
    }
}

export async function updateVerdict(hash: string, verdict: string): Promise<boolean> {
    try {
        await pool.query(
            `UPDATE safebrowsing_global_cache SET verdict = ? WHERE hash = ?`,
            [verdict, hash]
        )
        return true
    } catch (error) {
        console.error('Update verdict error:', error)
        return false
    }
}

export async function addHashWithVerdict(hash: string, verdict: string): Promise<void> {
    try {
        await pool.query(
            `INSERT IGNORE INTO safebrowsing_global_cache (hash, verdict) VALUES (?, ?)`,
            [hash, verdict]
        )
    } catch (error) {
        console.error('Add hash with verdict error:', error)
    }
}
