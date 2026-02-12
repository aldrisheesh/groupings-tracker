-- Create short_urls table for URL shortening
CREATE TABLE IF NOT EXISTS short_urls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  short_code TEXT NOT NULL UNIQUE,
  subject_id TEXT NOT NULL,
  grouping_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on short_code for fast lookups
CREATE INDEX IF NOT EXISTS idx_short_urls_code ON short_urls(short_code);

-- Create index on subject_id and grouping_id for reverse lookups
CREATE INDEX IF NOT EXISTS idx_short_urls_subject_grouping ON short_urls(subject_id, grouping_id);
