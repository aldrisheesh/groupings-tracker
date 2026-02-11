# 🎯 Getting Started with Groupings Tracker

A beginner-friendly guide to get you up and running in 15 minutes!

---

## 🎬 What You're Building

A web application where:
- **Admins** can create subjects, add students, and manage groups
- **Students** can join available groups and assign representatives
- **Everyone** sees the same data, even across different devices
- **Locked groupings** prevent unwanted changes

---

## ⏱️ Quick Setup (15 minutes)

### ✅ Step 1: Create Supabase Account (3 min)

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up with GitHub (fastest) or email
4. Confirm your email if needed

**✓ Done when:** You see the Supabase dashboard

---

### ✅ Step 2: Create Project (3 min)

1. Click "New Project"
2. Fill in:
   - **Name**: `groupings-tracker` (or anything you like)
   - **Database Password**: Make it strong! (save it somewhere)
   - **Region**: Choose closest to you
   - **Plan**: Free (selected by default)
3. Click "Create new project"
4. Wait 2-3 minutes (grab a coffee ☕)

**✓ Done when:** You see "Project ready!"

---

### ✅ Step 3: Set Up Database (4 min)

1. In your Supabase project, click **"SQL Editor"** (left sidebar)
2. Click **"New query"**
3. Go back to your Figma Make project
4. Open the file `/supabase/migrations/001_initial_schema.sql`
5. Copy ALL the contents (Ctrl+A, Ctrl+C)
6. Paste into Supabase SQL Editor
7. Click **"Run"** (or Ctrl+Enter)
8. Wait a few seconds
9. Should see: ✅ "Success. No rows returned"

**✓ Done when:** You see success message

---

### ✅ Step 4: Enable Real-Time Updates (2 min)

1. Go back to **"SQL Editor"** in Supabase
2. Click **"New query"**
3. Copy the contents of `/supabase/migrations/002_enable_realtime.sql`
4. Paste into SQL Editor
5. Click **"Run"**
6. Should see: ✅ "Success. No rows returned"

**✓ Done when:** You see success message

### ✅ Step 5: Enable Grouping Colors & History (2 min)

1. Still in **"SQL Editor"**
2. Click **"New query"**
3. Copy the contents of `/supabase/migrations/003_add_grouping_colors_and_history.sql`
4. Paste into SQL Editor
5. Click **"Run"**
6. Should see: ✅ "Success. No rows returned"

**✓ Done when:** You see success message

### ✅ Step 6: Verify Setup (2 min)

1. Click **"Table Editor"** (left sidebar)
2. You should see 6 tables:
   - subjects
   - students
   - groupings
   - groups
   - group_members
   - group_history

3. Click on "subjects" table
4. You should see 6 sample subjects (Mathematics, Physics, etc.)

5. Click on "groupings" table
6. You should see a "color" column

**✓ Done when:** You see all tables with sample data

---

### ✅ Step 7: Test Locally (3 min)

1. In your code editor/terminal, run:
   ```bash
   npm install
   npm run dev
   ```

2. Open browser to: `http://localhost:5173`

3. You should see:
   - Loading spinner (briefly)
   - 6 subject cards (Mathematics, Physics, etc.)
   - No errors in console

4. Click on "Mathematics"
   - Should see groupings: "Final Project", "Group Reporting", "Study Groups"

5. Click on "Final Project"
   - Should see groups: "Group Alpha" (3 members), "Group Beta" (2 members)

**✓ Done when:** You can navigate and see data

---

## 🎉 Success! You're Ready!

Your app is now:
- ✅ Connected to Supabase
- ✅ Loading real data from database
- ✅ Ready to use locally
- ✅ Ready to deploy

---

## 🚀 Optional: Deploy to Vercel (5 min)

Want to share with others? Deploy it!

### Option A: Quick Deploy

1. Go to [vercel.com](https://vercel.com)
2. Sign up/in with GitHub
3. Click "Add New..." → "Project"
4. Click "Import Git Repository"
5. Connect GitHub (if not already)
6. Select your repository
7. Click "Deploy"
8. Wait 2-3 minutes
9. Click on the URL they give you

**✓ Done when:** App loads at your Vercel URL

### Option B: Skip for Now

You can use it locally with `npm run dev` and deploy later!

---

## 🎓 Your First Tasks

Now that it's set up, let's learn by doing:

### 🔰 Beginner Tasks (5 min each)

#### Task 1: Toggle Admin Mode
1. Look at top-right corner
2. Click the "User Mode" button
3. Enter password: `wer124SantosPogi`
4. Click "Authenticate"
5. Notice button changes to "Admin Mode" and new features appear
6. Click "Admin Mode" again to toggle back

**What you learned:** Admin authentication and permissions

---

#### Task 2: Create a Subject
1. Enable admin mode (shield icon)
2. Click "+ Add New Subject"
3. Enter name: "Biology"
4. Choose a color (green)
5. Choose an icon (microscope)
6. Click "Create Subject"
7. See it appear in the list!

**What you learned:** Creating data in Supabase

---

#### Task 3: Add Students (Batch)
1. Click on your "Biology" subject
2. Click "Manage Enrolled Students"
3. Click "Batch Add Students"
4. Paste these names:
   ```
   Johnson, Emily
   Williams, Michael
   Brown, Sarah
   Davis, James
   ```
5. Click "Add Students"
6. See success message with count

**What you learned:** Batch operations

---

#### Task 4: Create a Grouping
1. Still in Biology subject
2. Scroll to "Grouping Categories"
3. Type "Lab Partners" in the input
4. Choose a color (e.g., green, blue, purple)
5. Click "Add Grouping"
6. See it appear with your chosen color!

**What you learned:** Creating related data with custom styling

---

#### Task 5: Create Groups (Single & Batch)
1. Click on "Lab Partners" grouping
2. Scroll to "Add Groups"
3. To create one group:
   - Select "Single Group" tab
   - Enter Name: "Team 1"
   - Enter Member Limit: 2
   - Click "Add Group"
4. To create many groups:
   - Select "Batch Create" tab
   - Enter Number of Groups: 5
   - Enter Member Limit: 6
   - Click "Batch Create Groups"
5. See your new groups in the list!

**What you learned:** Groups belong to groupings

---

#### Task 6: Join a Group (as Student)
1. Toggle admin mode OFF (shield icon)
2. Click "Join Group" on Team 1
3. Enter your name: "Smith, John"
4. Click "Join Group"
5. See your name in the member list!

**What you learned:** User perspective

---

#### Task 7: Lock a Grouping
1. Toggle admin mode ON
2. Still in "Lab Partners" grouping
3. Click "Lock Grouping" button (next to breadcrumb)
4. See "Locked" badge appear
5. Toggle admin OFF
6. Try to join - button says "Locked"!
7. Toggle admin ON, click "Unlock Grouping"

**What you learned:** Controlling access

---

#### Task 8: Test Dark Mode Persistence
1. Click the moon/sun icon in top-right navbar
2. Toggle to dark mode
3. See the entire app switch to dark theme
4. Refresh the page (F5 or Ctrl+R)
5. Notice dark mode is still active!
6. Toggle back to light mode if desired

**What you learned:** Persistent user preferences

---

#### Task 9: Share a Grouping Page
1. Navigate to any grouping page
2. Look for the share icon in the navbar (next to dark mode toggle)
3. Click the share icon
4. See a modal with a shareable link
5. Click "Copy Link"
6. Open a new incognito window and paste the link
7. Notice it takes you directly to that grouping!

**What you learned:** Deep linking and sharing functionality

---

#### Task 10: Export Groups to CSV
1. Toggle admin mode ON
2. Navigate to any grouping with groups
3. Click the download icon (near the lock button)
4. CSV file downloads with all group data
5. Open the CSV in Excel or Google Sheets
6. See all groups and their members

**What you learned:** Data export for record-keeping

---

#### Task 11: View Group History
1. In any grouping with activity
2. Click the "History" button
3. See a list of all changes (members added, removed, etc.)
4. Notice the real-time timestamp for each action
5. Try adding a member to a group
6. Watch the history update automatically!

**What you learned:** Activity tracking and audit logs

---

### 🌟 Intermediate Tasks (10 min each)

#### Task 12: Assign Representative
1. In a group with members
2. Hover over a member name
3. Click the crown icon (👑)
4. See crown badge appear
5. Click crown on another member
6. See it move to the new person

**What you learned:** Group roles

---

#### Task 13: Test Multi-User Real-Time Updates
1. Open app in incognito/different browser
2. In original window: Create a new subject
3. In incognito window: Refresh page
4. See the new subject appear!

**What you learned:** Data sync across users

---

#### Task 14: Test Real-Time Lock Updates
1. Keep both windows open (normal + incognito)
2. In normal window (as admin): Lock a grouping
3. In incognito window: Wait a moment (no refresh needed!)
4. Watch the lock badge appear automatically
5. Try to join a group - it's locked!
6. In normal window: Unlock
7. In incognito window: Watch it unlock automatically
8. Can join again!

**What you learned:** Real-time sync across all users

---

## 📚 Next Steps

### Learn More
- Read `README.md` for full feature list
- Check `ARCHITECTURE.md` to understand how it works
- Browse `DATABASE_SCHEMA.md` for database details

### Customize
- Change colors in `styles/globals.css`
- Add your school name to navbar
- Remove sample data (see QUICK_REFERENCE.md)

### Deploy
- Follow `DEPLOYMENT_CHECKLIST.md`
- Share URL with classmates
- Monitor usage in Supabase dashboard

### Extend
- Add email notifications
- Create CSV export
- Add group chat
- Build mobile app

---

## ❓ Common Questions

### Q: Can I use this without admin mode?
**A:** Yes! Regular users can:
- View all subjects and groups
- Join available groups
- Assign representatives
- Remove themselves from groups (if not locked)

They CANNOT:
- Create/edit/delete subjects
- Add/remove students
- Create groupings or groups
- Lock/unlock groupings
- Delete anything

---

### Q: What happens if I delete a subject?
**A:** Everything under it is deleted:
- All students enrolled in that subject
- All groupings in that subject
- All groups in those groupings
- All members in those groups

This is automatic (cascade delete). Be careful!

---

### Q: Can I use real student names?
**A:** You CAN, but remember:
- This is a prototype/school project tool
- Don't store sensitive info (grades, contact info)
- For production use, add authentication
- Check your school's privacy policies

---

### Q: What if I run out of free tier?
**A:** Unlikely! Free tier includes:
- 500MB database (you'll use <1%)
- 1GB bandwidth/month (plenty for 100+ users)
- 2 million edge function calls

For a school project, you won't hit limits.

---

### Q: Can multiple admins exist?
**A:** Currently, anyone who knows the password can access admin mode.

**Admin Password:** `wer124SantosPogi`

To change the password, edit `/components/Navbar.tsx` and update the `ADMIN_PASSWORD` constant.

For production, you'd want to:
1. Add user authentication
2. Store admin status in database
3. Only show toggle to actual admins
4. Enforce with database policies

---

### Q: What's the name format requirement?
**A:** Must be: `Last Name, First Name`

Examples:
- ✅ `Santos, Roi Aldrich`
- ✅ `Chen, Alice`
- ✅ `Smith-Jones, Mary Jane`
- ❌ `Roi Santos` (reversed)
- ❌ `Santos,Roi` (no space after comma)
- ❌ `santos, roi` (should be capitalized)

---

### Q: Can I change the name format?
**A:** Yes! Edit `/components/GroupCard.tsx`:

```typescript
// Find this function:
const validateNameFormat = (name: string): boolean => {
  const regex = /^[A-Za-z\s]+,\s*[A-Za-z\s]+$/;
  return regex.test(name.trim());
};

// Change to allow any format:
const validateNameFormat = (name: string): boolean => {
  return name.trim().length > 0; // Just check not empty
};
```

---

### Q: How do I remove sample data?
**A:** In Supabase SQL Editor, run:

```sql
DELETE FROM group_members;
DELETE FROM groups;
DELETE FROM groupings;
DELETE FROM students;
DELETE FROM subjects;
```

Then create your own subjects!

---

### Q: Can I add more fields (email, phone, etc.)?
**A:** Yes, but requires database changes:

1. Add column in Supabase:
   ```sql
   ALTER TABLE students ADD COLUMN email TEXT;
   ```

2. Update TypeScript types in `/utils/supabase/client.ts`

3. Update forms to include new field

4. Update database.ts functions to save new field

Better for learning: Keep it simple first!

---

## 🎯 Success Checklist

You're ready to use the app when you can:

- [ ] Toggle admin mode with password
- [ ] Create a new subject
- [ ] Add students (single and batch)
- [ ] Create a grouping category with custom color
- [ ] Create a group
- [ ] Join a group as a user
- [ ] Assign a group representative
- [ ] Lock a grouping
- [ ] Export groups to CSV
- [ ] View group history
- [ ] Share a grouping page link
- [ ] Toggle dark mode
- [ ] Verify dark mode persists after refresh
- [ ] See real-time changes in different browser without refreshing
- [ ] Navigate smoothly between pages

---

## 🆘 Help! Something's Wrong

### App won't load
1. Check terminal for errors
2. Run `npm install` again
3. Clear browser cache (Ctrl+Shift+Del)
4. Try incognito mode

### "Failed to load data"
1. Check Supabase project is active (not paused)
2. Verify you ran the migration SQL
3. Check browser console for specific error
4. Verify tables exist in Supabase Table Editor

### Can't join groups
1. Check if grouping is locked (badge should show)
2. Check if group is full (badge says "Full")
3. Check name format (Last, First)
4. Check browser console for errors

### Changes not saving
1. Check browser console for errors
2. Verify in Supabase Table Editor - did data actually save?
3. Check internet connection
4. Try refreshing the page

---

## 🎊 You Did It!

You now have a fully functional multi-user group management system!

### What You've Accomplished
✅ Set up a cloud database (Supabase)  
✅ Connected a React app to the database  
✅ Loaded and displayed data  
✅ Created, updated, and deleted records  
✅ Implemented access control (admin vs user)  
✅ Tested multi-user functionality  

### What's Next?
- Use it for your actual class projects!
- Share with classmates
- Customize the design
- Add your own features
- Deploy to share with the world

---

**Welcome to the world of full-stack development!** 🚀

You've just built something real that solves a real problem. That's awesome!

Need help? Check the other documentation files or the resources listed above.

**Happy grouping!** 🎓
