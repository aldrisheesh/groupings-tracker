# 🚀 Deployment Checklist

Use this checklist to deploy your Groupings Tracker to production.

---

## ✅ Pre-Deployment Checklist

### Supabase Setup
- [ ] Created Supabase account at [supabase.com](https://supabase.com)
- [ ] Created new Supabase project
- [ ] Noted down database password (saved securely)
- [ ] Ran migration SQL from `/supabase/migrations/001_initial_schema.sql`
- [ ] Verified all 5 tables were created (subjects, students, groupings, groups, group_members)
- [ ] Verified RLS policies are active
- [ ] Copied Project URL and anon public key
- [ ] App successfully connected to Supabase (already done via Figma Make)

### Code Verification
- [ ] App runs locally with `npm run dev`
- [ ] Loading spinner appears briefly on page load
- [ ] Sample data loads from Supabase
- [ ] Can create new subjects (admin mode)
- [ ] Can add students to subjects
- [ ] Can create groupings
- [ ] Can create groups
- [ ] Can add members to groups
- [ ] Can lock groupings (admin mode)
- [ ] Lock prevents regular users from joining
- [ ] Representatives can still be assigned when locked

### Build Test
- [ ] Run `npm run build` locally
- [ ] No TypeScript errors
- [ ] No build warnings (or only minor ones)
- [ ] Build completes successfully
- [ ] `dist` folder is created

---

## ✅ Vercel Deployment Checklist

### Initial Setup
- [ ] Created Vercel account at [vercel.com](https://vercel.com)
- [ ] Connected GitHub/GitLab (if using Git)
- [ ] OR prepared to upload code directly

### Deployment Configuration
- [ ] Imported project to Vercel
- [ ] Framework detected as "Vite" ✓
- [ ] Build command: `npm run build` ✓
- [ ] Output directory: `dist` ✓
- [ ] Install command: `npm install` ✓
- [ ] Node.js version: 18.x or higher ✓

### Deploy
- [ ] Clicked "Deploy" button
- [ ] Deployment completed successfully
- [ ] Got deployment URL (e.g., `https://groupings-tracker.vercel.app`)

---

## ✅ Post-Deployment Testing

### Basic Functionality
- [ ] Visit deployment URL
- [ ] App loads without errors
- [ ] Loading spinner appears
- [ ] Data loads from Supabase
- [ ] No console errors in browser DevTools

### User Features (Regular Mode)
- [ ] Can view subjects
- [ ] Can click on a subject
- [ ] Can view groupings
- [ ] Can click on a grouping
- [ ] Can view groups
- [ ] Can join a group (when not locked)
- [ ] Cannot join when group is full
- [ ] Cannot join when grouping is locked
- [ ] Can assign group representative
- [ ] Can remove themselves from group (when not locked)

### Admin Features (Admin Mode)
- [ ] Can toggle admin mode (top right)
- [ ] Can create new subject
- [ ] Can edit subject (name, color, icon)
- [ ] Can delete subject
- [ ] Can add single student
- [ ] Can batch add students
- [ ] Duplicate detection works
- [ ] Can remove students
- [ ] Can create grouping
- [ ] Can delete grouping
- [ ] Can create group
- [ ] Can edit group (name, member limit)
- [ ] Can delete group
- [ ] Can add members to group (batch)
- [ ] Can remove members from group
- [ ] Can lock/unlock grouping
- [ ] Lock button shows correct state

### Multi-User Testing
- [ ] Open app in second browser/incognito window
- [ ] Create a subject in window 1
- [ ] Refresh window 2
- [ ] Subject appears in window 2 ✓
- [ ] Lock a grouping in window 1
- [ ] Refresh window 2
- [ ] Grouping shows as locked in window 2 ✓
- [ ] Add member to group in window 1
- [ ] Refresh window 2
- [ ] Member appears in window 2 ✓

### Mobile Responsiveness
- [ ] Open on mobile device (or use browser DevTools mobile view)
- [ ] Navbar collapses to hamburger menu
- [ ] All pages are readable
- [ ] Buttons are tappable
- [ ] Dialogs fit on screen
- [ ] Forms are usable
- [ ] No horizontal scrolling
- [ ] Text is readable without zooming

### Dark Mode
- [ ] Toggle dark mode
- [ ] All text is readable
- [ ] No weird color combinations
- [ ] Icons are visible
- [ ] Buttons are clearly visible
- [ ] Forms are usable
- [ ] Cards have proper contrast

---

## ✅ Performance Checks

### Load Time
- [ ] Initial page load < 3 seconds
- [ ] Data loads from Supabase < 2 seconds
- [ ] Navigation between pages is instant

### Database
- [ ] Check Supabase dashboard for any errors
- [ ] Verify queries are completing successfully
- [ ] Check database size (should be minimal)
- [ ] Verify no duplicate records

### Browser Console
- [ ] No red errors in console
- [ ] No 404 errors for resources
- [ ] No CORS errors
- [ ] No authentication errors

---

## ✅ Optional Enhancements

### Custom Domain
- [ ] Purchase domain name (optional)
- [ ] Add domain to Vercel project
- [ ] Update DNS settings
- [ ] Verify SSL certificate

### Analytics
- [ ] Add Vercel Analytics (built-in, free)
- [ ] Or add Google Analytics
- [ ] Monitor page views
- [ ] Track user engagement

### Monitoring
- [ ] Set up Vercel deployment notifications
- [ ] Set up Supabase usage alerts
- [ ] Monitor error logs

### Backups
- [ ] Document backup procedure
- [ ] Schedule regular backups (if needed)
- [ ] Test restore procedure

---

## ✅ Share with Users

### Communication
- [ ] Share deployment URL with team/classmates
- [ ] Provide instructions for:
  - [ ] How to access the app
  - [ ] How to join groups
  - [ ] Name format requirement (Last, First)
  - [ ] Who to contact for admin actions
  - [ ] What to do if they encounter errors

### Documentation
- [ ] Create user guide (if needed)
- [ ] Document any custom workflows
- [ ] List admin contacts
- [ ] Share troubleshooting tips

---

## ✅ Maintenance Plan

### Regular Checks
- [ ] Weekly: Check Supabase usage
- [ ] Weekly: Review error logs in Vercel
- [ ] Monthly: Backup database
- [ ] As needed: Update student lists

### Support
- [ ] Designate admin contacts
- [ ] Set up support channel (email, Discord, etc.)
- [ ] Document common issues and solutions

### Updates
- [ ] Monitor for critical security updates
- [ ] Plan for end-of-semester cleanup (if applicable)
- [ ] Consider archiving old data

---

## 🎉 Launch!

Once all checkboxes are complete, you're ready to go!

**Your app is now:**
- ✅ Live on the internet
- ✅ Accessible from anywhere
- ✅ Synced across all users
- ✅ Persistent and reliable
- ✅ Free to use (within Supabase/Vercel limits)

---

## 📞 Need Help?

### Common Issues

**App not loading**
- Check browser console for errors
- Verify Supabase project is active
- Check Vercel deployment logs

**Data not saving**
- Check Supabase logs for errors
- Verify RLS policies are permissive
- Check browser console for errors

**Lock not working**
- Verify grouping.locked column exists
- Check that admin toggled lock successfully
- Refresh the page

### Resources
- **This project**: Read SUPABASE_SETUP.md
- **Supabase docs**: https://supabase.com/docs
- **Vercel docs**: https://vercel.com/docs
- **React docs**: https://react.dev

---

## 🎯 Success Metrics

Your deployment is successful if:

✅ App loads reliably  
✅ Users can join groups without admin help  
✅ Admin can manage all aspects  
✅ Data persists across sessions  
✅ Multiple users can use simultaneously  
✅ Lock feature works correctly  
✅ No critical errors in logs  
✅ Users find it intuitive to use  

**Congratulations on your deployment!** 🎊
