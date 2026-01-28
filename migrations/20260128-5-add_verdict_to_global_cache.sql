ALTER TABLE safebrowsing_global_cache
ADD COLUMN verdict VARCHAR(20) DEFAULT 'UNKNOWN',
ADD INDEX idx_verdict (verdict);
