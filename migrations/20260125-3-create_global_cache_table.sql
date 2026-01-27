CREATE TABLE safebrowsing_global_cache (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    hash CHAR(64) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_hash (hash)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_hash ON safebrowsing_global_cache(hash);
