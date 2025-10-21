-- Enable realtime for all tables
-- This allows the frontend to receive real-time updates when data changes

-- Enable realtime on subjects table
ALTER PUBLICATION supabase_realtime ADD TABLE subjects;

-- Enable realtime on students table
ALTER PUBLICATION supabase_realtime ADD TABLE students;

-- Enable realtime on groupings table
ALTER PUBLICATION supabase_realtime ADD TABLE groupings;

-- Enable realtime on groups table
ALTER PUBLICATION supabase_realtime ADD TABLE groups;

-- Enable realtime on group_members table
ALTER PUBLICATION supabase_realtime ADD TABLE group_members;
