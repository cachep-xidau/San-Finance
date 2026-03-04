-- Sync logs table
CREATE TABLE IF NOT EXISTS sync_logs (
  id SERIAL PRIMARY KEY,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'running',
  duration_ms INTEGER,
  details JSONB
);

-- Enable RLS
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read
CREATE POLICY "Authenticated users can view sync logs"
  ON sync_logs FOR SELECT
  TO authenticated
  USING (true);

-- Allow service role to insert/update
CREATE POLICY "Service role can manage sync logs"
  ON sync_logs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Index for ordering
CREATE INDEX IF NOT EXISTS idx_sync_logs_started ON sync_logs (started_at DESC);
