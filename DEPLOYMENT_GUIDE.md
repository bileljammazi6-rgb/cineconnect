# CineConnect - Secure Deployment Guide

## 🗄️ Database Setup (Supabase)

### 1. Create a New Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Choose your organization and region
4. Set a strong database password

### 2. Run the Secure Schema
1. Go to your Supabase dashboard
2. Navigate to `SQL Editor`
3. Create a new query
4. Copy the entire content of `secure_database_schema.sql`
5. Paste it and click "Run"
6. Verify all tables are created successfully

### 3. Configure Authentication
1. Go to `Authentication` > `Settings`
2. Enable email authentication
3. Configure email templates (optional)
4. Set up any additional providers (Google, GitHub, etc.)

### 4. Set Up Storage (for image uploads)
1. Go to `Storage`
2. Create a new bucket called `chat-images`
3. Set the bucket to public
4. Configure RLS policies for the bucket:

```sql
-- Allow authenticated users to upload images
CREATE POLICY "Users can upload images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'chat-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public read access to images
CREATE POLICY "Images are publicly accessible" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'chat-images');

-- Allow users to delete their own images
CREATE POLICY "Users can delete own images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'chat-images' AND auth.uid()::text = (storage.foldername(name))[1]);
```

## 🌐 Frontend Deployment (Netlify)

### 1. Prepare Environment Variables
Create a `.env` file (for local development):
```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# TMDB API Configuration
VITE_TMDB_API_KEY=your_tmdb_api_key_here

# Mapbox Configuration (optional)
VITE_MAPBOX_ACCESS_TOKEN=your_mapbox_access_token_here

# OpenAI API Configuration (optional - for AI chatbot)
OPENAI_API_KEY=your_openai_api_key_here
```

### 2. Configure Netlify Environment Variables
1. Go to your Netlify dashboard
2. Navigate to `Site settings` > `Environment variables`
3. Add each environment variable:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_TMDB_API_KEY`
   - `VITE_MAPBOX_ACCESS_TOKEN` (if using maps)
   - `OPENAI_API_KEY` (optional - for AI chatbot)

### 3. Deploy to Netlify

#### Option A: Git-based Deployment (Recommended)
1. Push your code to GitHub/GitLab/Bitbucket
2. Connect your Netlify account to your repository
3. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Node version**: `18` (set in environment variables as `NODE_VERSION=18`)

#### Option B: Manual Deployment
1. Build locally: `npm run build`
2. Drag and drop the `dist` folder to Netlify

### 4. Configure Redirects
Create a `_redirects` file in your `public` folder:
```
# Handle client-side routing
/*    /index.html   200

# Security headers
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
```

## 🔐 Security Configuration

### 1. Supabase RLS Verification
Run this query to verify RLS is enabled on all tables:
```sql
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = false;
```
Should return no rows.

### 2. API Key Security
- ✅ TMDB API key is now using environment variables
- ✅ Supabase keys are environment variables
- ✅ OpenAI API key secured in serverless function
- ✅ No hardcoded secrets in the codebase
- ✅ Fallback chatbot works without OpenAI API

### 3. Content Security Policy (Optional)
Add to your `netlify.toml`:
```toml
[[headers]]
  for = "/*"
  [headers.values]
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co https://api.themoviedb.org https://api.bigdatacloud.net; frame-src 'none';"
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
```

## 🧪 Testing Your Deployment

### 1. Database Tests
```sql
-- Test user creation
INSERT INTO users (email, username) VALUES ('test@example.com', 'testuser');

-- Test RLS policies
SELECT * FROM users; -- Should work for authenticated users

-- Test message constraints
INSERT INTO messages (sender_id, receiver_id, content) 
VALUES ('same-id', 'same-id', 'test'); -- Should fail
```

### 2. Application Tests
1. ✅ User registration works
2. ✅ Login/logout works
3. ✅ Messages can be sent and received
4. ✅ Image upload works
5. ✅ Location features work (if using maps)
6. ✅ No console errors
7. ✅ API keys are not exposed in browser

## 🚀 Post-Deployment Checklist

- [ ] All environment variables set correctly
- [ ] Database schema applied successfully
- [ ] RLS policies are working
- [ ] Authentication is functional
- [ ] File uploads work
- [ ] Chatbot responds (fallback mode works without OpenAI)
- [ ] No hardcoded secrets in code
- [ ] HTTPS is enabled (automatic on Netlify)
- [ ] Site loads without errors
- [ ] All features tested

## 🤖 Chatbot Configuration

### Option 1: Smart Fallback Mode (Default - No API Key Needed)
The chatbot is pre-configured with intelligent responses covering:
- Movie and show recommendations
- Platform feature explanations
- General entertainment guidance
- Interactive conversations

### Option 2: OpenAI-Powered Mode (Optional)
To enable AI-powered responses:
1. Get OpenAI API key from [platform.openai.com](https://platform.openai.com)
2. Add `OPENAI_API_KEY` to Netlify environment variables
3. The secure serverless function will handle API calls
4. Falls back to smart responses if API fails

## 🔧 Troubleshooting

### Common Issues:

1. **"supabase is not defined"**
   - Check environment variables are set correctly
   - Ensure VITE_ prefix is used

2. **"Failed to fetch" errors**
   - Verify Supabase URL and key
   - Check network/CORS issues

3. **Database errors**
   - Verify schema was applied correctly
   - Check RLS policies are enabled

4. **Build failures**
   - Check Node.js version compatibility
   - Run `npm install` before building

### Debug Commands:
```bash
# Check environment variables
npm run dev -- --debug

# Test build locally
npm run build
npm run preview

# Check for TypeScript errors
npm run type-check
```

## 📊 Performance Optimization

1. **Database Indexes**: All critical indexes are included in the schema
2. **Image Optimization**: Consider adding image compression
3. **Lazy Loading**: Components are optimized for code splitting
4. **Caching**: Netlify provides automatic CDN caching

## 🔄 Ongoing Maintenance

1. **Regular Dependency Updates**:
   ```bash
   npm audit
   npm update
   ```

2. **Database Backups**: Supabase provides automatic backups

3. **Security Monitoring**: 
   - Monitor Supabase logs
   - Check for unusual activity
   - Regular security audits

4. **Performance Monitoring**:
   - Monitor Core Web Vitals
   - Track API response times
   - Monitor error rates

Your application is now securely deployed with enterprise-grade security practices! 🎉