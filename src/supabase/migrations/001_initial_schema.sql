-- Create tables for Groupings Tracker

-- Subjects table
CREATE TABLE IF NOT EXISTS subjects (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  icon TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Students table
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Groupings table (categories like "Final Project", "Lab Partners", etc.)
CREATE TABLE IF NOT EXISTS groupings (
  id UUID PRIMARY KEY,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  locked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Groups table
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY,
  grouping_id UUID NOT NULL REFERENCES groupings(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  member_limit INTEGER NOT NULL CHECK (member_limit > 0),
  representative TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Group members table
CREATE TABLE IF NOT EXISTS group_members (
  id UUID PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  member_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, member_name)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_students_subject_id ON students(subject_id);
CREATE INDEX IF NOT EXISTS idx_groupings_subject_id ON groupings(subject_id);
CREATE INDEX IF NOT EXISTS idx_groups_grouping_id ON groups(grouping_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);

-- Enable Row Level Security (RLS)
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE groupings ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- Create permissive policies (allow all operations for now)
-- Note: For production, you should restrict these based on user roles/authentication

-- Subjects policies
CREATE POLICY "Allow all operations on subjects" ON subjects
  FOR ALL USING (true) WITH CHECK (true);

-- Students policies
CREATE POLICY "Allow all operations on students" ON students
  FOR ALL USING (true) WITH CHECK (true);

-- Groupings policies
CREATE POLICY "Allow all operations on groupings" ON groupings
  FOR ALL USING (true) WITH CHECK (true);

-- Groups policies
CREATE POLICY "Allow all operations on groups" ON groups
  FOR ALL USING (true) WITH CHECK (true);

-- Group members policies
CREATE POLICY "Allow all operations on group_members" ON group_members
  FOR ALL USING (true) WITH CHECK (true);

-- Insert sample data (optional - remove if you want to start fresh)
INSERT INTO subjects (id, name, color, icon) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Mathematics', 'bg-blue-500', 'calculator'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Physics', 'bg-purple-500', 'atom'),
  ('550e8400-e29b-41d4-a716-446655440003', 'History', 'bg-amber-500', 'book-open'),
  ('550e8400-e29b-41d4-a716-446655440004', 'Computer Science', 'bg-emerald-500', 'laptop'),
  ('550e8400-e29b-41d4-a716-446655440005', 'Chemistry', 'bg-pink-500', 'flask-conical'),
  ('550e8400-e29b-41d4-a716-446655440006', 'Literature', 'bg-indigo-500', 'pen-tool')
ON CONFLICT (id) DO NOTHING;

INSERT INTO groupings (id, subject_id, title) VALUES
  ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Final Project'),
  ('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'Group Reporting'),
  ('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'Study Groups'),
  ('660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440002', 'Lab Partners'),
  ('660e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', 'Research Teams'),
  ('660e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440003', 'Presentation Groups')
ON CONFLICT (id) DO NOTHING;

INSERT INTO groups (id, grouping_id, name, member_limit) VALUES
  ('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 'Group Alpha', 4),
  ('770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440001', 'Group Beta', 5),
  ('770e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440001', 'Group Gamma', 3),
  ('770e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440004', 'Team 1', 2),
  ('770e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440004', 'Team 2', 2)
ON CONFLICT (id) DO NOTHING;

INSERT INTO group_members (id, group_id, member_name) VALUES
  ('880e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', 'Chen, Alice'),
  ('880e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440001', 'Smith, Bob'),
  ('880e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440001', 'Zhang, Carol'),
  ('880e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440002', 'Lee, David'),
  ('880e8400-e29b-41d4-a716-446655440005', '770e8400-e29b-41d4-a716-446655440002', 'Wilson, Emma')
ON CONFLICT (id) DO NOTHING;
