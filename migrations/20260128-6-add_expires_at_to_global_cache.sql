ALTER TABLE safebrowsing_global_cache
ADD COLUMN expires_at TIMESTAMP NULL,
ADD INDEX idx_expires_at (expires_at);
