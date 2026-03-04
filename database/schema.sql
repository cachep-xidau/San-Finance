-- S Group Data Warehouse Schema

-- Raw data from sources (CSV)
CREATE TABLE IF NOT EXISTS raw_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_type TEXT NOT NULL,
    source_id TEXT NOT NULL,
    data_json TEXT NOT NULL,
    row_count INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_raw_source ON raw_data(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_raw_created ON raw_data(created_at);

-- Processed data after transformation
CREATE TABLE IF NOT EXISTS processed_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    raw_data_id INTEGER,
    entity_type TEXT NOT NULL,
    data_json TEXT NOT NULL,
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (raw_data_id) REFERENCES raw_data(id)
);

CREATE INDEX IF NOT EXISTS idx_processed_entity ON processed_data(entity_type);
CREATE INDEX IF NOT EXISTS idx_processed_at ON processed_data(processed_at);

-- ETL execution logs
CREATE TABLE IF NOT EXISTS etl_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id TEXT NOT NULL UNIQUE,
    job_type TEXT NOT NULL,
    status TEXT NOT NULL,
    source_type TEXT,
    source_id TEXT,
    rows_processed INTEGER DEFAULT 0,
    rows_failed INTEGER DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    duration_seconds REAL
);

CREATE INDEX IF NOT EXISTS idx_logs_job ON etl_logs(job_id);
CREATE INDEX IF NOT EXISTS idx_logs_status ON etl_logs(status);
CREATE INDEX IF NOT EXISTS idx_logs_started ON etl_logs(started_at);

-- Metadata and configuration
CREATE TABLE IF NOT EXISTS metadata (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT NOT NULL UNIQUE,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_metadata_key ON metadata(key);

-- Data source configuration
CREATE TABLE IF NOT EXISTS data_sources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_name TEXT NOT NULL UNIQUE,
    source_type TEXT NOT NULL,
    source_id TEXT NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    schedule_cron TEXT,
    last_sync_at TIMESTAMP,
    config_json TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sources_active ON data_sources(is_active);
CREATE INDEX IF NOT EXISTS idx_sources_type ON data_sources(source_type);

-- Insert default metadata
INSERT OR IGNORE INTO metadata (key, value, description) VALUES
    ('schema_version', '1.0.0', 'Database schema version'),
    ('last_etl_run', '', 'Last successful ETL run timestamp'),
    ('etl_enabled', 'true', 'Enable/disable ETL jobs');
