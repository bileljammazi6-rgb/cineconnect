# CineConnect Netlify Deployment Guide

## Prerequisites
1. Supabase project with database schema deployed
2. Netlify account

## Deployment Steps

### 1. Connect Repository to Netlify
1. Go to Netlify dashboard
2. Click "New site from Git"
3. Connect to GitHub and select `bileljammazi6-rgb/cineconnect`
4. Select branch: `devin/1754352273-cineconnect-fixes-and-enhancements`

### 2. Configure Build Settings
- Build command: `npm run build`
- Publish directory: `dist`
- Node version: 18

### 3. Set Environment Variables
In Netlify dashboard > Site settings > Environment variables, add:
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key
- `VITE_TMDB_API_KEY`: Your TMDB API key (optional)

### 4. Deploy
Click "Deploy site" - the app should now work correctly!

## Important Notes

### Why the blank page occurred:
1. Missing environment variables - the app throws an error if `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` are not configured
2. Missing SPA routing configuration - Netlify needs `_redirects` file to handle client-side routing
3. Wrong project deployed - ensure you're deploying the CineConnect React app, not other HTML files

### Configuration Files Added:
- `_redirects`: Handles SPA routing for React app
- `netlify.toml`: Build configuration and environment settings
- This deployment guide

### Troubleshooting:
- Check browser console for JavaScript errors
- Verify environment variables are set in Netlify dashboard
- Ensure build command is `npm run build` and publish directory is `dist`
- Check Netlify build logs for any compilation errors

### Database Setup:
Make sure to run the complete database schema file (`complete_database_schema.sql`) in your Supabase project before deploying.
