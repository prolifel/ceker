-- Create request_logs table to track all website check requests
CREATE TABLE request_logs (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    url VARCHAR(2048) NOT NULL,
    hostname VARCHAR(255) NOT NULL,
    risk_level VARCHAR(20), -- 'LEGITIMATE', 'SUSPICIOUS', 'WARNING', or NULL for failed scans
    message VARCHAR(512),
    details TEXT, -- JSON array of detail strings
    screenshot_path VARCHAR(512),
    ip_address VARCHAR(45), -- IPv4 or IPv6
    user_agent VARCHAR(512),
    scan_status VARCHAR(20) NOT NULL, -- 'success', 'not_in_db', 'error', 'cancelled'
    bypass_domain_check BOOLEAN DEFAULT FALSE,
    cloudflare_verdict VARCHAR(50),
    domain_age_days INT,
    domain_expires DATETIME,
    domain_registrar VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_created_at (created_at),
    INDEX idx_hostname (hostname),
    INDEX idx_risk_level (risk_level),
    INDEX idx_scan_status (scan_status)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
