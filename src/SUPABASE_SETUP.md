# Supabase Setup Guide for Groupings Tracker

This guide will help you connect your Groupings Tracker app to Supabase and deploy it to Vercel.

## 🎯 Overview

You're transforming your app from client-side only to a full-stack application with:
- ✅ Persistent database storage
- ✅ Real-time data sync across all users
- ✅ Multi-user support
- ✅ Lock states that work for everyone
- ✅ No data loss on page reload

---

## 📋 Prerequisites

- A free Supabase account ([signup here](https://supabase.com))
- A free Vercel account ([signup here](https://vercel.com))
- Your app code (which you already have!)

---

## 🚀 Step-by-Step Setup

### Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **"New Project"**
3. Fill in the details:
   - **Name**: `groupings-tracker` (or any name you like)
   - **Database Password**: Create a strong password (save it somewhere!)
   - **Region**: Choose the closest region to your users
   - **Pricing Plan**: Free (perfect for this project)
4. Click **"Create new project"**
5. Wait 2-3 minutes for your project to be provisioned

### Step 2: Run the Database Migration

1. In your Supabase project dashboard, click **"SQL Editor"** in the left sidebar
2. Click **"New query"**
3. Copy the entire contents of `/supabase/migrations/001_initial_schema.sql` from this project
4. Paste it into the SQL editor
5. Click **"Run"** (or press `Ctrl/Cmd + Enter`)
6. You should see a success message: ✅ "Success. No rows returned"

### Step 3: Verify Tables Were Created

1. Click **"Table Editor"** in the left sidebar
2. You should see these 5 tables:
   - `subjects`
   - `students`
   - `groupings`
   - `groups`
   - `group_members`
3. Click on each table to see the sample data that was inserted

### Step 3.5: Enable Real-Time Updates (Required)

To enable instant synchronization across all users:

1. Go back to **SQL Editor** in Supabase
2. Click **"New Query"**
3. Copy and paste the contents of `/supabase/migrations/002_enable_realtime.sql`:
   ```sql
   ALTER PUBLICATION supabase_realtime ADD TABLE subjects;
   ALTER PUBLICATION supabase_realtime ADD TABLE students;
   ALTER PUBLICATION supabase_realtime ADD TABLE groupings;
   ALTER PUBLICATION supabase_realtime ADD TABLE groups;
   ALTER PUBLICATION supabase_realtime ADD TABLE group_members;
   ```
4. Click **"Run"**
5. You should see: "Success. No rows returned"

This enables real-time broadcasting on all tables so changes appear instantly for all connected users without refreshing.

### Step 4: Get Your Supabase Credentials

1. Click **"Settings"** (gear icon) in the left sidebar
2. Click **"API"** under Project Settings
3. You'll need two values:
   - **Project URL**: Looks like `https://xxxxxxxxxxxxx.supabase.co`
   - **anon public key**: A long JWT token (click the copy icon)

**IMPORTANT**: The anon public key is safe to use in your frontend code. Do NOT use the `service_role` key in your frontend - that's a secret key!

### Step 5: Update Your App Configuration

The app is already connected! When you connected to Supabase earlier, the configuration was automatically set up in `/utils/supabase/info.tsx`.

You can verify the connection by checking that file exists and has your project details.

---

## 🌐 Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended)

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New..."** → **"Project"**
3. Import your repository:
   - If your code is on GitHub: Connect GitHub and select your repository
   - If not on GitHub: You can use Vercel CLI or upload as a zip
4. Configure the project:
   - **Framework Preset**: Vite (should be auto-detected)
   - **Root Directory**: `./` (leave as default)
   - **Build Command**: `npm run build` (should be pre-filled)
   - **Output Directory**: `dist` (should be pre-filled)
5. Click **"Deploy"**
6. Wait 2-3 minutes for deployment to complete
7. You'll get a live URL like: `https://groupings-tracker.vercel.app`

### Option B: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow the prompts
# Choose "Y" to deploy
# Accept defaults for build settings
```

---

## ✅ Testing Your Deployment

1. Visit your Vercel URL
2. The app should show a loading spinner briefly, then load the subjects
3. Test admin features:
   - Toggle admin mode (top right)
   - Create a new subject
   - Add students to a subject
   - Create a grouping category
   - Create groups
   - Add members to groups
   - Lock a grouping
4. **Real-time multi-user test**:
   - Open the app in a different browser or incognito window
   - Make a change in one window (e.g., add a student)
   - **Watch the other window update instantly WITHOUT refreshing!**
   - This confirms real-time sync is working

---

## 🔧 How It Works

### Database Schema

```
subjects
  ├── students (many-to-one)
  └── groupings (many-to-one)
      └── groups (many-to-one)
          └── group_members (many-to-one)
```

### Data Flow

1. **Page Load**: App fetches all data from Supabase
2. **User Action**: User creates/updates/deletes something
3. **Database Update**: App sends request to Supabase
4. **Local State Update**: App updates local state for instant UI feedback
5. **Next Page Load**: Any user (including the same user) gets fresh data

### Lock Feature

- Lock state stored in `groupings.locked` column
- When admin toggles lock, it updates the database
- All users see the locked state because they fetch from the same database
- Locked groupings prevent normal users from joining/leaving groups
- Representatives can still be assigned even when locked

---

## 🎨 Customization Options

### Remove Sample Data

If you want to start with an empty database:

1. Go to Supabase SQL Editor
2. Run this query:
```sql
DELETE FROM group_members;
DELETE FROM groups;
DELETE FROM groupings;
DELETE FROM students;
DELETE FROM subjects;
```

### Add Authentication (Advanced)

Currently, anyone can access and modify data. To add user authentication:

1. In Supabase, go to **Authentication** → **Providers**
2. Enable Email or Google authentication
3. Update RLS policies in the database to restrict access based on user roles
4. Add login/signup pages to your app

This requires more advanced setup - the current implementation is perfect for a school project or internal tool.

---

## 📊 Monitoring Usage

### Check Database Usage

1. In Supabase, go to **Settings** → **Usage**
2. Monitor:
   - Database size (500 MB limit on free plan)
   - Bandwidth (1 GB/month on free plan)
   - Database connections

### Check Deployment Logs

1. In Vercel, go to your project
2. Click **"Deployments"**
3. Click on a deployment to see build logs
4. Go to **"Functions"** tab to see runtime logs

---

## 🐛 Troubleshooting

### "Failed to load data" error

**Cause**: Cannot connect to Supabase

**Solutions**:
1. Check that your Supabase project is active (not paused)
2. Verify the project URL and anon key in `/utils/supabase/info.tsx`
3. Check browser console for detailed error messages
4. Verify RLS policies are set up correctly (they should allow all operations)

### Changes not appearing for other users

**Cause**: Data not being saved to database

**Solutions**:
1. Check browser console for error messages
2. Verify the operation completed successfully (no toast errors)
3. Check Supabase Table Editor to see if data was actually written
4. Try hard refresh (Ctrl+F5) on the other browser

### "Cannot read properties of undefined" errors

**Cause**: Data structure mismatch

**Solutions**:
1. Check that all tables were created correctly
2. Verify sample data was inserted
3. Check browser console for the specific error
4. Try re-running the migration SQL

### App stuck on loading screen

**Cause**: Database connection failing

**Solutions**:
1. Check browser console for errors
2. Verify Supabase project is active
3. Check that tables exist in Supabase Table Editor
4. Verify internet connection

---

## 💡 Tips & Best Practices

### Development Workflow

1. Make changes locally
2. Test in development (Vite dev server: `npm run dev`)
3. Commit to Git
4. Vercel auto-deploys on push to main branch

### Data Safety

1. **Backup**: Supabase automatically backs up your database
2. **No destructive operations**: Be careful with delete operations
3. **Test first**: Use sample data to test features before real use

### Performance

- The app loads all data on mount (fine for small datasets)
- For 1000+ groups, consider pagination
- Current setup handles hundreds of subjects/groupings/groups easily

### Cost Management

- Free tier is generous for school projects
- Monitor usage in Supabase dashboard
- Set up billing alerts if worried about overages
- Most school projects will never exceed free limits

---

## 🎉 You're All Set!

Your Groupings Tracker is now a fully functional multi-user web application with persistent storage. All users will see the same data, and lock states will work across all browsers and devices.

### What You Can Do Now

✅ Share the Vercel URL with classmates/teammates
✅ Add subjects and groupings for your actual classes
✅ Enroll real students
✅ Create groups and manage members
✅ Lock groupings when finalized
✅ Access from any device, anywhere

### Next Steps (Optional)

- Add user authentication for better security
- Customize colors and branding
- Add email notifications for group assignments
- Export group data to CSV
- Add a dashboard with statistics

---

## 📞 Need Help?

- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **React Docs**: [react.dev](https://react.dev)

Happy tracking! 🚀
