# ⚡ Quick Reference

Quick commands and snippets for common tasks.

---

## 🚀 Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type check
npx tsc --noEmit
```

---

## 🗄️ Supabase SQL Snippets

### View All Tables
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

### Count All Records
```sql
SELECT 
  'subjects' as table_name, COUNT(*) FROM subjects
UNION ALL SELECT 'students', COUNT(*) FROM students
UNION ALL SELECT 'groupings', COUNT(*) FROM groupings
UNION ALL SELECT 'groups', COUNT(*) FROM groups
UNION ALL SELECT 'group_members', COUNT(*) FROM group_members;
```

### Clear All Data (Keep Structure)
```sql
TRUNCATE group_members, groups, groupings, students, subjects CASCADE;
```

### Find Groups with Available Spots
```sql
SELECT 
  g.id,
  g.name,
  g.member_limit,
  COUNT(gm.id) as current_members,
  g.member_limit - COUNT(gm.id) as spots_available
FROM groups g
LEFT JOIN group_members gm ON gm.group_id = g.id
GROUP BY g.id, g.name, g.member_limit
HAVING COUNT(gm.id) < g.member_limit;
```

### Find Students Not in Any Group (for a grouping)
```sql
SELECT s.name
FROM students s
WHERE s.subject_id = 'your-subject-id-here'
  AND s.name NOT IN (
    SELECT gm.member_name
    FROM group_members gm
    JOIN groups g ON g.id = gm.group_id
    WHERE g.grouping_id = 'your-grouping-id-here'
  );
```

### Get All Locked Groupings
```sql
SELECT 
  s.name as subject,
  gr.title as grouping,
  gr.locked
FROM groupings gr
JOIN subjects s ON s.id = gr.subject_id
WHERE gr.locked = true;
```

### Unlock All Groupings
```sql
UPDATE groupings SET locked = false;
```

### Database Size
```sql
SELECT 
  pg_size_pretty(pg_database_size(current_database())) as total_size;
```

### Table Sizes
```sql
SELECT 
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## 💾 Backup & Restore

### Export Data (SQL Dump)
In Supabase Dashboard:
1. Database → Backups
2. Click "Download backup"
3. Save `.sql` file

### Import Data
In Supabase SQL Editor:
1. Open saved `.sql` file
2. Copy contents
3. Paste in SQL Editor
4. Click "Run"

### Export as JSON (for migration)
```bash
# Install supabase CLI
npm install -g supabase

# Login
supabase login

# Pull schema
supabase db pull
```

---

## 🎨 Tailwind CSS Reference

### Colors Used in App
```
Primary: indigo (600, 500, 400)
Success: emerald (500, 600)
Error: red (500, 600)
Warning: amber (500, 600, 100, 800)
Neutral: slate (50-950)
```

### Common Classes
```css
/* Containers */
container mx-auto px-4 py-8

/* Cards */
bg-white dark:bg-slate-900 rounded-lg shadow-md p-6

/* Buttons */
bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md

/* Text */
text-slate-700 dark:text-slate-300

/* Spacing */
space-y-4  /* vertical gap */
gap-4      /* flex/grid gap */
```

---

## 🧩 Component Snippets

### Add New Page
```tsx
// /components/NewPage.tsx
import { ChevronLeft } from "lucide-react";
import { Button } from "./ui/button";

interface NewPageProps {
  onBack: () => void;
}

export function NewPage({ onBack }: NewPageProps) {
  return (
    <div className="space-y-8">
      <Button variant="ghost" onClick={onBack}>
        <ChevronLeft className="w-4 h-4 mr-2" />
        Back
      </Button>
      
      <div>
        {/* Your content */}
      </div>
    </div>
  );
}
```

### Add New Database Operation
```typescript
// /utils/supabase/database.ts

export async function yourNewFunction(param: string): Promise<YourType | null> {
  const { data, error } = await supabase
    .from('your_table')
    .insert([{ column: param }])
    .select()
    .single();

  if (error) {
    console.error('Error:', error);
    return null;
  }

  return data;
}
```

### Add Toast Notification
```tsx
import { toast } from "sonner@2.0.3";

// Success
toast.success("Operation successful!");

// Error
toast.error("Something went wrong");

// With description
toast.success("Group created!", {
  description: "Members can now join this group",
});

// With icon
toast.success("Done!", { icon: "✓" });
```

---

## 🔧 Common Fixes

### Fix: App Won't Load
```bash
# 1. Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# 2. Clear build cache
rm -rf dist
npm run build

# 3. Check Supabase connection
# Verify /utils/supabase/info.tsx has correct values
```

### Fix: Types Error
```bash
# Regenerate TypeScript types
npx tsc --noEmit

# If Supabase types are wrong, update them
npm update @supabase/supabase-js
```

### Fix: Vercel Build Fails
```bash
# Test build locally first
npm run build

# Check build logs in Vercel dashboard
# Common issues:
# - Missing environment variables (should auto-populate)
# - TypeScript errors
# - Import errors
```

### Fix: Database Connection Error
```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Should all show 't' (true)

-- If not, enable RLS:
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
-- ... etc
```

---

## 📊 Environment Variables

### Local Development
Already configured via Figma Make connection.

### Vercel Deployment
Automatically set when deploying through Figma Make.

### Manual Setup (if needed)
```bash
# Create .env file (DO NOT COMMIT)
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...your-key
```

---

## 🎯 Testing Checklist

### Basic Functionality
```
□ App loads without errors
□ Can navigate to all pages
□ Can toggle admin mode
□ Can toggle dark mode
□ Toast notifications appear
□ Loading states show
```

### Subject Management
```
□ Can create subject
□ Can edit subject (name, color, icon)
□ Can delete subject
□ Student count shows correctly
□ Grouping count shows correctly
```

### Student Management
```
□ Can add single student
□ Can add batch students
□ Duplicate detection works
□ Can remove student
□ Name format validation works
□ Enrolled count updates
```

### Grouping Management
```
□ Can create grouping
□ Can delete grouping
□ Can lock/unlock grouping
□ Lock badge shows when locked
□ Group count shows correctly
```

### Group Management
```
□ Can create group
□ Can edit group (name, limit)
□ Can delete group
□ Can add members (single or batch)
□ Can remove members
□ Cannot join when full
□ Cannot join when locked (non-admin)
□ Can assign representative
□ Can remove representative
□ Member count updates
```

### Multi-User
```
□ Changes save to database
□ Other users see changes after refresh
□ Lock works for all users
```

---

## 🐛 Debug Mode

### Enable Detailed Logging
```tsx
// In /utils/supabase/database.ts
// Change console.error to console.log for all operations

export async function fetchSubjects() {
  console.log('Fetching subjects...');
  const { data, error } = await supabase
    .from('subjects')
    .select('*');
  
  console.log('Result:', { data, error });
  // ...
}
```

### Browser Console Shortcuts
```javascript
// Access Supabase client in console
window.supabase = supabase;

// Check current state
localStorage // View all local storage

// Clear cache
localStorage.clear()
sessionStorage.clear()
location.reload()
```

---

## 📱 Mobile Testing

### Browser DevTools
```
1. Open DevTools (F12)
2. Click device icon (Ctrl+Shift+M)
3. Select device:
   - iPhone 12 Pro (390x844)
   - iPad Air (820x1180)
   - Galaxy S20 (360x800)
```

### Real Device
```
1. Get local IP: ipconfig (Windows) or ifconfig (Mac)
2. Start dev server: npm run dev
3. Access from phone: http://192.168.x.x:5173
4. Or use ngrok for external access
```

---

## 🚀 Performance Tips

### Optimize Bundle Size
```bash
# Analyze bundle
npm run build
npx vite-bundle-visualizer
```

### Lazy Load Pages
```tsx
import { lazy, Suspense } from 'react';

const SubjectPage = lazy(() => import('./components/SubjectPage'));

// In render:
<Suspense fallback={<LoadingSpinner />}>
  <SubjectPage />
</Suspense>
```

### Database Query Optimization
```typescript
// Instead of fetching all then filtering:
const groups = allGroups.filter(g => g.groupingId === id);

// Fetch filtered from database:
const { data } = await supabase
  .from('groups')
  .select('*')
  .eq('grouping_id', id);
```

---

## 📞 Support Resources

### Documentation
- This project: `/README.md`, `/SUPABASE_SETUP.md`
- React: https://react.dev
- TypeScript: https://typescriptlang.org/docs
- Tailwind: https://tailwindcss.com/docs
- Supabase: https://supabase.com/docs
- shadcn/ui: https://ui.shadcn.com

### Communities
- React Discord: https://discord.gg/react
- Supabase Discord: https://discord.supabase.com
- Tailwind Discord: https://discord.gg/tailwindcss

### Tools
- Supabase Dashboard: https://app.supabase.com
- Vercel Dashboard: https://vercel.com/dashboard
- Lucide Icons: https://lucide.dev

---

## 🎓 Learning Resources

### React
- Official Tutorial: https://react.dev/learn
- React Hooks: https://react.dev/reference/react

### TypeScript
- Handbook: https://typescriptlang.org/docs/handbook/intro.html
- Cheat Sheet: https://react-typescript-cheatsheet.netlify.app

### Supabase
- Quickstart: https://supabase.com/docs/guides/getting-started
- Database Guide: https://supabase.com/docs/guides/database

### Tailwind CSS
- Core Concepts: https://tailwindcss.com/docs/utility-first
- Customization: https://tailwindcss.com/docs/configuration

---

## 💡 Pro Tips

1. **Use keyboard shortcuts**: Enter to submit, Escape to close dialogs
2. **Batch operations save time**: Use textarea for multiple students/members
3. **Lock before finalizing**: Prevent changes when groups are set
4. **Name format matters**: Always "Last, First" for consistency
5. **Test in incognito**: See the app as a new user would
6. **Check console often**: Errors show helpful debug info
7. **Backup before big changes**: Download Supabase backup
8. **Monitor usage**: Check Supabase dashboard weekly
9. **Dark mode friendly**: Always test both light and dark themes
10. **Mobile matters**: Test on real devices, not just desktop

---

**Bookmark this page for quick access!** ⭐
