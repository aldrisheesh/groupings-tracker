# 🚀 Quick Deployment Guide

## Files Added for Deployment

The following files were created to enable Vercel deployment:

- ✅ `index.html` - HTML entry point
- ✅ `main.tsx` - React entry point  
- ✅ `package.json` - Dependencies and build scripts
- ✅ `vite.config.ts` - Vite build configuration
- ✅ `tsconfig.json` - TypeScript configuration
- ✅ `tsconfig.node.json` - TypeScript config for build tools
- ✅ `postcss.config.js` - PostCSS configuration
- ✅ `tailwind.config.js` - Tailwind CSS configuration
- ✅ `vercel.json` - Vercel deployment settings
- ✅ `.gitignore` - Files to exclude from Git

## 📦 Deploy to Vercel

### Step 1: Commit and Push

```bash
git add .
git commit -m "Add deployment configuration"
git push
```

### Step 2: Deploy on Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. Vercel will auto-detect the Vite framework
5. Click "Deploy"

### Step 3: Verify Settings

Make sure these are set in Vercel (should be automatic):

- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Step 4: Environment Variables (Important!)

You need to add your Supabase credentials in Vercel:

1. Go to Project Settings → Environment Variables
2. Add these variables:
   - `VITE_SUPABASE_URL` = Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` = Your Supabase anon key

You can find these values in `/utils/supabase/info.tsx`

## 🧪 Test Locally First

Before deploying, test the build locally:

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## ✅ Deployment Checklist

- [ ] All files committed and pushed
- [ ] Supabase database tables created (see `GETTING_STARTED.md`)
- [ ] Environment variables added in Vercel
- [ ] Build completes successfully
- [ ] Site loads without errors
- [ ] Data loads from Supabase
- [ ] All features work correctly

## 🐛 Troubleshooting

### White Screen
- Check browser console for errors
- Verify Supabase environment variables are set
- Check that database tables exist

### Build Fails
- Make sure all dependencies install correctly
- Check build logs in Vercel for specific errors
- Try building locally: `npm run build`

### Data Not Loading
- Verify Supabase URL and key are correct
- Check database tables exist
- Review Supabase logs

## 📚 More Help

See `DEPLOYMENT_GUIDE.md` for comprehensive deployment instructions.
