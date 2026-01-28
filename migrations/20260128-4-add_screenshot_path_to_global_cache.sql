ALTER TABLE safebrowsing_global_cache
ADD COLUMN screenshot_path VARCHAR(255) NULL,
ADD INDEX idx_screenshot_path (screenshot_path);
