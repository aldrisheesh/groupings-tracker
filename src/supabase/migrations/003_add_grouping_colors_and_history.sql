-- Add color column to groupings table
ALTER TABLE groupings ADD COLUMN IF NOT EXISTS color TEXT DEFAULT 'bg-indigo-500';

-- Create group_history table for tracking changes
CREATE TABLE IF NOT EXISTS group_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grouping_id UUID NOT NULL REFERENCES groupings(id) ON DELETE CASCADE,
  group_id UUID REFERENCES groups(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL, -- 'group_created', 'group_deleted', 'member_added', 'member_removed', 'group_updated', 'representative_set', 'representative_removed'
  group_name TEXT NOT NULL,
  member_name TEXT, -- For member-related actions
  details TEXT, -- Additional details (e.g., "Member limit changed from 5 to 6")
  performed_by TEXT NOT NULL, -- 'admin' or 'user'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_group_history_grouping_id ON group_history(grouping_id);
CREATE INDEX IF NOT EXISTS idx_group_history_created_at ON group_history(created_at DESC);

-- Enable Row Level Security
ALTER TABLE group_history ENABLE ROW LEVEL SECURITY;

-- Create policy (allow all read/write for now)
CREATE POLICY "Allow all operations on group_history" ON group_history
  FOR ALL USING (true) WITH CHECK (true);

-- Update existing groupings to have default color if not set
UPDATE groupings SET color = 'bg-indigo-500' WHERE color IS NULL;
