import { pool } from '@/lib/shared/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

export interface RequestLogRow extends RowDataPacket {
    id: number;
    url: string;
    hostname: string;
    risk_level: string | null;
    message: string | null;
    details: string | null;
    screenshot_path: string | null;
    ip_address: string | null;
    user_agent: string | null;
    scan_status: string;
    bypass_domain_check: number;
    cloudflare_verdict: string | null;
    domain_age_days: number | null;
    domain_expires: Date | null;
    domain_registrar: string | null;
    created_at: Date;
}

export interface CreateRequestLogParams {
    url: string;
    hostname: string;
    risk_level?: string;
    message?: string;
    details?: string[];
    screenshot_path?: string;
    ip_address?: string;
    user_agent?: string;
    scan_status: 'success' | 'not_in_db' | 'error' | 'cancelled';
    bypass_domain_check?: boolean;
    cloudflare_verdict?: string;
    domain_age_days?: number;
    domain_expires?: Date;
    domain_registrar?: string;
}

export async function createRequestLog(params: CreateRequestLogParams): Promise<number | null> {
    try {
        const detailsJson = params.details ? JSON.stringify(params.details) : null;
        const [res] = await pool.execute<ResultSetHeader>(
            `INSERT INTO request_logs
            (url, hostname, risk_level, message, details, screenshot_path, ip_address, user_agent, scan_status, bypass_domain_check, cloudflare_verdict, domain_age_days, domain_expires, domain_registrar)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                params.url,
                params.hostname,
                params.risk_level || null,
                params.message || null,
                detailsJson,
                params.screenshot_path || null,
                params.ip_address || null,
                params.user_agent || null,
                params.scan_status,
                params.bypass_domain_check ? 1 : 0,
                params.cloudflare_verdict || null,
                params.domain_age_days || null,
                params.domain_expires || null,
                params.domain_registrar || null,
            ]
        );
        return res.insertId;
    } catch (error) {
        console.error('Failed to create request log:', error);
        return null;
    }
}
