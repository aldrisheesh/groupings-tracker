// Keep this equivalent to public.deadline_name in migration 004.
export const exactStudentName = (name: string) => name.trim().replace(/\s+/g, ' ').toLowerCase();
