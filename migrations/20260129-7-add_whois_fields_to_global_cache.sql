ALTER TABLE safebrowsing_global_cache
    ADD COLUMN domain_created DATETIME NULL COMMENT 'Domain registration date',
    ADD COLUMN domain_expires DATETIME NULL COMMENT 'Domain expiration date',
    ADD COLUMN domain_registrar VARCHAR(255) NULL COMMENT 'Domain registrar name',
    ADD COLUMN abuse_contact VARCHAR(255) NULL COMMENT 'Abuse contact email address',
    ADD COLUMN domain_age_days INT NULL COMMENT 'Domain age in days';
