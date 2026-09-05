// Keep this equivalent to public.deadline_name in migration 004.
export const exactStudentName = (name: string) => name.trim().replace(/\s+/g, ' ').toLowerCase();

// Prefer a full-name match. Otherwise require a complete surname and one or
// more whole given-name words, identifying exactly one enrolled student.
export function resolveStudentName<T extends { name: string }>(input: string, students: T[]): T | undefined {
  const parts = exactStudentName(input).split(',').map(part => part.trim());
  if (parts.length !== 2 || !parts[0] || !parts[1]) return undefined;
  const sameSurname = students.filter(student => {
    const enrolled = exactStudentName(student.name).split(',').map(part => part.trim());
    return enrolled.length === 2 && enrolled[0] === parts[0];
  });
  const exact = sameSurname.filter(student => exactStudentName(student.name).split(',')[1].trim() === parts[1]);
  if (exact.length) return exact.length === 1 ? exact[0] : undefined;
  const words = parts[1].split(' ');
  const matches = sameSurname.filter(student => {
    const givenNames = exactStudentName(student.name).split(',')[1].trim().split(' ');
    return words.every(word => givenNames.includes(word));
  });
  return matches.length === 1 ? matches[0] : undefined;
}
