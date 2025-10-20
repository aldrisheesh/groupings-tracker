# 🎓 Groupings Tracker

A modern, clean, and minimal dashboard-style web app for managing student groups in academic subjects. Built with React, TypeScript, Tailwind CSS, and Supabase.

![Built with React](https://img.shields.io/badge/React-18-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-06B6D4?logo=tailwindcss)
![Supabase](https://img.shields.io/badge/Supabase-Connected-3ECF8E?logo=supabase)

---

## ✨ Features

### 👥 Group Management
- Create unlimited subjects (courses/classes)
- Add grouping categories (Final Project, Lab Partners, etc.)
- Create groups with customizable member limits
- Batch add members (admin) or self-join (users)
- Assign group representatives with crown icon
- Visual status indicators (Available/Full)

### 🔒 Admin Controls
- Toggle admin mode with dedicated controls
- Lock groupings to prevent member changes
- Batch enroll students (one per line)
- Full CRUD operations on all entities
- Delete protection with confirmation dialogs

### 📊 Smart Features
- Duplicate detection with visual highlighting
- Student availability counter per grouping
- Name format validation (Last Name, First Name)
- Real-time member limit enforcement
- Representative assignment (works even when locked)

### 🎨 User Experience
- Fully responsive (mobile, tablet, desktop)
- Dark mode support
- Smooth animations and transitions
- Toast notifications for all actions
- Keyboard shortcuts (Enter to submit, Ctrl+Enter for batch)
- Accessible UI components (shadcn/ui)

### 💾 Data Persistence
- Supabase PostgreSQL database
- Multi-user support with real-time sync
- Lock states work across all users
- No data loss on page reload
- Automatic cascading deletes

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Free Supabase account
- Free Vercel account (for deployment)

### Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd groupings-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase** (First time only)
   - Follow the complete guide in `SUPABASE_SETUP.md`
   - Create Supabase project
   - Run migration SQL
   - Connect to Supabase (already done in Figma Make)

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open browser**
   ```
   http://localhost:5173
   ```

---

## 📦 Deployment

### Deploy to Vercel

1. **Push to GitHub** (recommended)
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Click "Deploy"

3. **Verify deployment**
   - Visit your Vercel URL
   - Test all features
   - Use deployment checklist: `DEPLOYMENT_CHECKLIST.md`

**Detailed instructions**: See `SUPABASE_SETUP.md`

---

## 📖 Documentation

| Document | Description |
|----------|-------------|
| `SUPABASE_SETUP.md` | Complete setup guide for Supabase + Vercel |
| `DATABASE_SCHEMA.md` | Database structure and query examples |
| `DEPLOYMENT_CHECKLIST.md` | Step-by-step deployment verification |

---

## 🏗️ Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS 4.0** - Styling
- **Vite** - Build tool
- **shadcn/ui** - UI components
- **Lucide React** - Icons
- **Sonner** - Toast notifications

### Backend
- **Supabase** - Backend as a Service
  - PostgreSQL database
  - Auto-generated REST API
  - Row Level Security (RLS)
  - Real-time subscriptions (optional)

### Deployment
- **Vercel** - Hosting platform
- **GitHub** - Version control (optional)

---

## 🗂️ Project Structure

```
groupings-tracker/
├── src/
│   ├── components/
│   │   ├── ui/              # shadcn/ui components
│   │   ├── Navbar.tsx       # Top navigation
│   │   ├── SubjectsPage.tsx # Subject list view
│   │   ├── SubjectPage.tsx  # Single subject view
│   │   ├── GroupingPage.tsx # Grouping view with groups
│   │   └── GroupCard.tsx    # Individual group card
│   ├── utils/
│   │   └── supabase/
│   │       ├── client.ts    # Supabase client + types
│   │       ├── database.ts  # Database operations
│   │       └── info.tsx     # Project credentials
│   ├── styles/
│   │   └── globals.css      # Global styles + Tailwind
│   └── App.tsx              # Main app component
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql  # Database schema
├── SUPABASE_SETUP.md        # Setup guide
├── DATABASE_SCHEMA.md       # Schema reference
└── DEPLOYMENT_CHECKLIST.md  # Deployment guide
```

---

## 💡 Usage Guide

### For Administrators

1. **Enable Admin Mode**
   - Click the shield toggle in top-right navbar

2. **Create a Subject**
   - Click "Add New Subject"
   - Enter name, choose color and icon
   - Click "Create Subject"

3. **Add Students** (Batch)
   - Click on the subject
   - Click "Manage Enrolled Students"
   - Paste names (one per line)
   - Format: `Last Name, First Name`
   - Click "Add Students"

4. **Create Grouping**
   - In subject view, scroll to "Grouping Categories"
   - Enter grouping title (e.g., "Final Project")
   - Click "Add Grouping"

5. **Create Groups**
   - Click on the grouping
   - Scroll to "Create New Group"
   - Enter group name and member limit
   - Click "Create Group"

6. **Lock Grouping** (Optional)
   - In grouping view, click "Lock Grouping"
   - Users can view but not join/leave
   - Representatives can still be assigned

### For Students/Users

1. **View Subjects**
   - See all available subjects on home page

2. **Join a Group**
   - Click subject → Click grouping
   - Find an available group
   - Click "Join Group"
   - Enter your name: `Last Name, First Name`
   - Click "Join Group"

3. **Leave a Group** (if unlocked)
   - Hover over your name in the member list
   - Click the X button

4. **Assign Representative**
   - Hover over a member's name
   - Click the crown icon
   - Click again to unassign

---

## 🎨 Customization

### Change Colors

Edit `styles/globals.css`:
```css
:root {
  --color-primary: 99 102 241; /* Indigo */
}
```

### Change Icons

Icons from [Lucide React](https://lucide.dev/):
```tsx
import { YourIcon } from "lucide-react";
```

### Add Features

Common additions:
- Email notifications
- CSV export
- Group chat integration
- Attendance tracking
- File uploads per group

---

## 🐛 Troubleshooting

### App stuck on loading screen
- **Check**: Supabase project is active
- **Check**: Tables exist in Supabase Table Editor
- **Check**: Browser console for errors
- **Fix**: Re-run migration SQL

### Changes not syncing between users
- **Check**: Changes are saving (no toast errors)
- **Check**: Data exists in Supabase Table Editor
- **Fix**: Hard refresh (Ctrl+F5) on other browser

### Lock not working
- **Check**: Grouping has `locked` column
- **Check**: Admin toggled lock successfully
- **Fix**: Check Supabase for `locked = true`

### Name format errors
- **Format**: `Last Name, First Name`
- **Example**: ✅ `Santos, Roi Aldrich`
- **Invalid**: ❌ `Roi Santos`, ❌ `Santos,Roi`

---

## 📊 Database Limits (Free Tier)

| Resource | Limit | Usage Estimate |
|----------|-------|----------------|
| Database Size | 500 MB | ~550,000 records |
| Bandwidth | 1 GB/month | Thousands of users |
| Storage | 1 GB | Not used by default |

**Typical school project**: <0.1% of limits 🎉

---

## 🔐 Security Notes

### Current Setup
- Open access (no login required)
- Suitable for internal tools, school projects
- Not suitable for sensitive data

### For Production
To add authentication:
1. Enable Supabase Auth
2. Update RLS policies
3. Add login/signup pages
4. Restrict admin actions to authenticated admins

See Supabase Auth docs for details.

---

## 🤝 Contributing

This is a school/project tool, but suggestions welcome!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

## 📄 License

MIT License - feel free to use for any purpose!

---

## 🙏 Acknowledgments

- Built with [Figma Make](https://figma.com)
- UI components from [shadcn/ui](https://ui.shadcn.com)
- Icons from [Lucide](https://lucide.dev)
- Backend by [Supabase](https://supabase.com)
- Hosted on [Vercel](https://vercel.com)

---

## 📞 Support

- **Issues**: Open a GitHub issue
- **Questions**: Check `SUPABASE_SETUP.md`
- **Bugs**: Include browser console errors

---

**Happy grouping!** 🎉

Made with ❤️ for students and educators
