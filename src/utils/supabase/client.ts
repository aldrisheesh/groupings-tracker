import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info';

const supabaseUrl = `https://${projectId}.supabase.co`;

export const supabase = createClient(supabaseUrl, publicAnonKey);

// Database types
export type DbSubject = {
  id: string;
  name: string;
  color: string;
  icon: string;
  created_at: string;
};

export type DbStudent = {
  id: string;
  subject_id: string;
  name: string;
  created_at: string;
};

export type DbGrouping = {
  id: string;
  subject_id: string;
  title: string;
  locked: boolean;
  created_at: string;
};

export type DbGroup = {
  id: string;
  grouping_id: string;
  name: string;
  member_limit: number;
  representative: string | null;
  created_at: string;
};

export type DbGroupMember = {
  id: string;
  group_id: string;
  member_name: string;
  created_at: string;
};
