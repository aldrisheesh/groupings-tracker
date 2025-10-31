# 🏛️ Architecture Overview

This document explains how all the pieces of Groupings Tracker fit together.

---

## 📐 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER'S BROWSER                          │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    React Application                     │  │
│  │                        (App.tsx)                         │  │
│  │                                                          │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │  │
│  │  │ SubjectsPage│  │ SubjectPage  │  │ GroupingPage  │  │  │
│  │  └─────────────┘  └──────────────┘  └───────────────┘  │  │
│  │                                                          │  │
│  │  ┌──────────────────────────────────────────────────┐   │  │
│  │  │         Local State Management (useState)        │   │  │
│  │  │  • subjects[]  • groupings[]  • groups[]         │   │  │
│  │  └──────────────────────────────────────────────────┘   │  │
│  │                          ↕                               │  │
│  │  ┌──────────────────────────────────────────────────┐   │  │
│  │  │       Supabase Client (database.ts)              │   │  │
│  │  │  • fetchSubjects()  • createGroup()              │   │  │
│  │  │  • addStudent()     • toggleLock()               │   │  │
│  │  └──────────────────────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↕ HTTPS
┌─────────────────────────────────────────────────────────────────┐
│                        Supabase Cloud                           │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │               PostgreSQL Database                        │  │
│  │                                                          │  │
│  │  ┌──────────┐  ┌──────────┐  ┌───────────┐             │  │
│  │  │ subjects │  │ students │  │ groupings │             │  │
│  │  └──────────┘  └──────────┘  └───────────┘             │  │
│  │       ↓             ↓              ↓                     │  │
│  │  ┌──────────┐  ┌────────────────┐  ┌──────────────┐   │  │
│  │  │  groups  │  │ group_members  │  │group_history │   │  │
│  │  └──────────┘  └────────────────┘  └──────────────┘   │  │
│  │                                                          │  │
│  │  ┌──────────────────────────────────────────────────┐   │  │
│  │  │         Row Level Security (RLS)                 │   │  │
│  │  │  Policies: Allow all operations                  │   │  │
│  │  └──────────────────────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │               Auto-Generated REST API                   │  │
│  │  POST /rest/v1/subjects                                 │  │
│  │  GET  /rest/v1/groups?grouping_id=eq.123               │  │
│  │  DELETE /rest/v1/groups?id=eq.456                      │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                         Vercel CDN                              │
│              Hosts static files (HTML, CSS, JS)                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow

### Example: User Joins a Group

```
1. User Action
   └─> User clicks "Join Group" button
       └─> Opens dialog with name input

2. Input & Validation
   └─> User enters "Santos, Roi Aldrich"
       └─> Frontend validates format (regex check)
           └─> ✅ Format valid
               └─> Checks if already in another group
                   └─> ✅ Not in any group
                       └─> Checks if group is full
                           └─> ✅ Space available

3. API Call
   └─> Calls: db.addMemberToGroup(groupId, memberName)
       └─> Supabase Client makes request:
           POST https://xxx.supabase.co/rest/v1/group_members
           {
             id: "uuid",
             group_id: "123",
             member_name: "Santos, Roi Aldrich"
           }

4. Database Operation
   └─> PostgreSQL executes INSERT
       └─> Checks UNIQUE constraint (no duplicates)
           └─> Checks RLS policy (allow all)
               └─> ✅ Insert succeeds
                   └─> Returns confirmation

5. UI Update
   └─> Frontend receives success response
       └─> Updates local state:
           groups.map(g => 
             g.id === groupId 
               ? {...g, members: [...g.members, memberName]}
               : g
           )
       └─> Shows success toast
           └─> Closes dialog
               └─> UI re-renders with new member

6. Other Users
   └─> Other users have old data in state
       └─> They refresh page (or implement real-time)
           └─> Fetch latest data from Supabase
               └─> See the new member
```

---

## 🔑 Key Concepts

### 1. Client-Side State Management with Real-Time Sync

**What it is:**
- React `useState` hooks store data in browser memory
- Supabase real-time subscriptions keep all users synchronized
- Fast UI updates without manual refresh

**How it works:**
```tsx
const [groups, setGroups] = useState<Group[]>([]);

// When user joins a group locally:
setGroups(groups.map(g => 
  g.id === groupId 
    ? {...g, members: [...g.members, newMember]}
    : g
));

// Real-time subscription updates other users:
supabase.channel('group_members')
  .on('INSERT', (payload) => {
    // Automatically update state when others join
    setGroups(prev => /* update with new member */);
  })
  .subscribe();
```

**Why we use it:**
- Instant UI feedback for the acting user
- Automatic sync across all connected users
- No manual refresh needed
- Better collaborative experience

**Benefits:**
- Changes appear instantly for all users (typically 100-300ms)
- No polling or periodic refreshes
- Efficient use of bandwidth

---

### 2. Optimistic UI Updates

**What it is:**
- Update UI immediately, before server confirms

**Flow:**
```
User clicks button
  → UI updates instantly (optimistic)
    → API call to server
      → If success: Keep UI as-is ✅
      → If error: Revert UI + show error ❌
```

**Implementation:**
```tsx
// Update local state first
setGroups([...groups, newGroup]);
toast.success("Group created!");

// Then sync with database
const result = await db.createGroup(...);

// If it fails, could revert:
if (!result) {
  setGroups(groups.filter(g => g.id !== newGroup.id));
  toast.error("Failed to create group");
}
```

---

### 3. Cascade Deletes

**What it is:**
- When you delete a parent, children are auto-deleted

**Example:**
```sql
DELETE FROM subjects WHERE id = '123';

-- Automatically also deletes:
-- • All students in that subject
-- • All groupings in that subject
-- • All groups in those groupings
-- • All members in those groups
```

**Why it's important:**
- No orphaned data
- No manual cleanup needed
- Consistent database state

**How it's defined:**
```sql
CREATE TABLE students (
  ...
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE
);
```

---

### 4. Row Level Security (RLS)

**What it is:**
- PostgreSQL security feature
- Controls who can read/write each row

**Current setup:**
```sql
CREATE POLICY "Allow all" ON subjects
  FOR ALL 
  USING (true)      -- Anyone can read
  WITH CHECK (true) -- Anyone can write
```

**For production with auth:**
```sql
-- Only authenticated users can read
USING (auth.role() = 'authenticated')

-- Only admins can delete
USING (
  auth.jwt() ->> 'role' = 'admin'
  AND operation = 'DELETE'
)
```

---

### 5. Lock Feature Implementation

**Database:**
```sql
-- groupings table has locked column
ALTER TABLE groupings ADD COLUMN locked BOOLEAN DEFAULT false;
```

**Frontend checks:**
```tsx
// In GroupCard.tsx
<Button
  disabled={isFull || (isLocked && !isAdmin)}
  onClick={...}
>
  {isLocked && !isAdmin ? "Locked" : "Join Group"}
</Button>

// Remove member button
{!isLocked && (
  <Button onClick={removeMember}>
    <X />
  </Button>
)}
```

**Database enforcement:**
```tsx
// In database.ts
export async function toggleGroupingLock(id: string, currentLocked: boolean) {
  const { error } = await supabase
    .from('groupings')
    .update({ locked: !currentLocked })
    .eq('id', id);
  
  return !error;
}
```

**Why it works across users:**
- Lock state stored in database (single source of truth)
- All users fetch from same database
- When they refresh, they get latest lock state

---

## 📊 Component Hierarchy

```
App.tsx
├── Navbar.tsx
│   ├── Logo/Title
│   ├── Admin Toggle
│   └── Dark Mode Toggle
│
├── SubjectsPage.tsx (home)
│   ├── SubjectCard[] (grid)
│   │   ├── Icon
│   │   ├── Name
│   │   ├── Student Count
│   │   └── Grouping Count
│   │
│   └── CreateSubjectDialog (admin only)
│       ├── Name Input
│       ├── Color Selector
│       └── Icon Selector
│
├── SubjectPage.tsx
│   ├── Back Button
│   ├── Subject Header
│   ├── Enrolled Students Section
│   │   ├── Student List
│   │   └── Manage Students Dialog (admin)
│   │       ├── Single Add
│   │       └── Batch Add (textarea)
│   │
│   └── Grouping Categories Section
│       ├── GroupingCard[]
│       │   ├── Title
│       │   ├── Group Count
│       │   └── Delete Button (admin)
│       │
│       └── Create Grouping Form (admin)
│
└── GroupingPage.tsx
    ├── Back Button
    ├── Breadcrumb (Subject → Grouping)
    ├── Lock Toggle (admin)
    ├── Student Availability Counter
    │
    ├── GroupCard[] (grid)
    │   ├── Header
    │   │   ├── Name + Icon
    │   │   ├── Status Badge (Available/Full)
    │   │   ├── Edit Button (admin)
    │   │   └── Delete Button (admin)
    │   │
    │   ├── Members List
    │   │   ├── Member Name
    │   │   ├── Representative Badge (if applicable)
    │   │   ├── Crown Icon (assign rep)
    │   │   └── X Icon (remove, if not locked)
    │   │
    │   └── Join/Add Button
    │       ├── "Join Group" (regular user)
    │       ├── "Add Members" (admin)
    │       ├── "Group Full" (disabled if full)
    │       └── "Locked" (disabled if locked & not admin)
    │
    └── Create Group Form (admin)
```

---

## 🗄️ Database Relationships

```
subjects (1)
    ├─→ students (many)
    └─→ groupings (many)
            ├─→ groups (many)
            │       └─→ group_members (many)
            └─→ group_history (many)
```

**Explained:**
- One subject has many students
- One subject has many groupings
- One grouping has many groups
- One group has many members

**Foreign Keys:**
```sql
students.subject_id → subjects.id
groupings.subject_id → subjects.id
groups.grouping_id → groupings.id
group_members.group_id → groups.id
group_history.grouping_id → groupings.id
group_history.group_id → groups.id (nullable)
```

---

## 🚀 Build & Deployment Process

```
Local Development
    ↓
1. Code changes in /src
    ↓
2. Vite dev server (npm run dev)
    ↓ (when ready to deploy)
3. Git commit & push
    ↓
4. GitHub repository
    ↓
5. Vercel detects push
    ↓
6. Vercel builds:
   - Runs: npm install
   - Runs: npm run build
   - Output: /dist folder
    ↓
7. Vercel deploys to CDN
    ↓
8. Users access: https://your-app.vercel.app
    ↓
9. Browser loads static files
    ↓
10. React app runs
    ↓
11. Connects to Supabase
    ↓
12. Fetches data
    ↓
13. App ready! ✅
```

---

## 🔄 Real-Time Updates (Already Implemented)

The app uses Supabase real-time subscriptions to sync changes across all users instantly:

```tsx
useEffect(() => {
  // Subscribe to group changes
  const subscription = supabase
    .channel('groups')
    .on(
      'postgres_changes',
      { 
        event: '*', 
        schema: 'public', 
        table: 'groups' 
      },
      (payload) => {
        console.log('Group changed:', payload);
        // Reload groups from database
        loadGroups();
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}, []);
```

**Benefits:**
- No manual refresh needed
- Instant updates across all users
- Better collaborative experience

**Costs:**
- Uses more Supabase bandwidth
- More complex code
- Still fine on free tier for small teams

---

## 📈 Scaling Considerations

### Current Architecture (Good for)
- ✅ <50 concurrent users
- ✅ <10,000 total records
- ✅ School projects, small teams
- ✅ Internal tools

### If You Need to Scale

**For 100+ concurrent users:**
- Add caching (React Query, SWR)
- Implement pagination
- Add search/filtering on server side

**For 100,000+ records:**
- Add database indexes (already have some)
- Implement virtual scrolling
- Add server-side pagination
- Consider Redis cache

**For production app:**
- Add authentication
- Implement proper authorization
- Add rate limiting
- Set up monitoring (Sentry, LogRocket)
- Add automated backups
- Implement audit logs

---

## 🎯 Design Decisions

### Why Client-Side State?
- Simpler than Redux/Zustand for this size
- Fast UI updates
- Easy to understand and maintain

### Why Supabase?
- Free tier is generous
- No backend code needed
- Built-in database, auth, storage
- Auto-generated API

### Why Not Real-Time by Default?
- Adds complexity
- Refresh is acceptable for most use cases
- Can be added later if needed

### Why Permissive RLS Policies?
- Simpler for school projects
- No authentication setup needed
- Can tighten later if needed

### Why Batch Operations?
- Common use case (enrolling classes)
- Better UX than one-by-one
- More efficient for database

---

## 🔐 Security Model

### Current (Development/School Use)

```
┌─────────────┐
│   Browser   │ ← Anyone can access
└─────────────┘
      ↓
┌─────────────┐
│  Supabase   │ ← Open policies (anyone can CRUD)
└─────────────┘
```

**Suitable for:**
- Classroom projects
- Internal team tools
- Prototypes
- Non-sensitive data

---

### Production (with Auth)

```
┌─────────────┐
│   Browser   │ ← Must log in
└─────────────┘
      ↓ (JWT token)
┌─────────────┐
│  Supabase   │ ← RLS policies check user role
│   Database  │   - Students: Read all, write own
│             │   - Admins: Full access
└─────────────┘
```

**Requires:**
- Supabase Auth setup
- Login/signup pages
- Role-based RLS policies
- Protected routes

---

## 💡 Future Enhancements

### Easy Adds (1-2 hours each)
- Export groups to CSV
- Print-friendly view
- Group history/changelog
- Duplicate group (copy members)

### Medium Adds (4-8 hours each)
- User authentication
- Email notifications
- Group chat integration
- File uploads per group
- Mobile app (React Native)

### Advanced Adds (16+ hours each)
- Automatic group formation (algorithms)
- Student skill matching
- Integration with Canvas/Google Classroom
- Analytics dashboard
- Multi-tenant support

---

## 📚 Related Documentation

- `SUPABASE_SETUP.md` - How to set up Supabase and deploy
- `DATABASE_SCHEMA.md` - Database structure details
- `DEPLOYMENT_CHECKLIST.md` - Pre/post deployment checks
- `README.md` - General project overview

---

That's the complete architecture! 🎉

Understanding this will help you:
- Debug issues faster
- Add new features
- Optimize performance
- Scale when needed
