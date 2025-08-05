# 🎬 CineConnect - Entertainment Social Platform

A modern, full-featured social platform for movie enthusiasts with real-time chat, AI assistance, and interactive features.

## 🚀 Features

- **🎬 Movie Discovery**: TMDB integration for movie search and recommendations
- **💬 Real-time Chat**: WhatsApp-style messaging with user search
- **🤖 AI Assistant**: OpenAI-powered chatbot with intelligent responses
- **📍 Location Sharing**: Interactive map with user locations
- **📱 Social Feed**: Posts, likes, comments, and social interactions
- **🎮 Games**: Interactive games like Tic-Tac-Toe
- **👥 User Profiles**: Customizable profiles with avatars and bios
- **🔔 Notifications**: Real-time notifications for interactions
- **📱 Mobile Responsive**: Perfect experience on all devices

## 🛠 Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Real-time)
- **Authentication**: Supabase Auth
- **AI**: OpenAI API (with Netlify Functions)
- **Maps**: Mapbox GL
- **Movies**: TMDB API
- **Deployment**: Netlify

## 📋 Prerequisites

- Node.js 18+ 
- Supabase account
- TMDB API key (optional)
- Mapbox API key (optional)
- OpenAI API key (optional)

## 🚀 Quick Deployment to Netlify

### 1. Database Setup

1. **Create a Supabase project** at [supabase.com](https://supabase.com)
2. **Go to SQL Editor** in your Supabase dashboard
3. **Copy and paste** the entire content from `production_database_complete.sql`
4. **Run the script** - this creates all tables, policies, triggers, and storage buckets

### 2. Get API Keys

#### Required:
- **Supabase URL**: From your project settings
- **Supabase Anon Key**: From your project API settings

#### Optional (for enhanced features):
- **TMDB API Key**: Register at [themoviedb.org](https://www.themoviedb.org/settings/api)
- **Mapbox Token**: Get from [mapbox.com](https://account.mapbox.com/access-tokens/)
- **OpenAI API Key**: Get from [platform.openai.com](https://platform.openai.com/api-keys)

### 3. Deploy to Netlify

#### Option A: Deploy from GitHub (Recommended)

1. **Fork this repository**
2. **Go to Netlify** and connect your GitHub account
3. **Import the project** from your forked repository
4. **Build settings** will be auto-detected:
   - Build command: `npm run build`
   - Publish directory: `dist`

#### Option B: Deploy with Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy from project root
netlify deploy --prod --dir=dist
```

### 4. Configure Environment Variables

In **Netlify Dashboard** → **Site Settings** → **Environment Variables**, add:

#### Required:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

#### Optional:
```
VITE_TMDB_API_KEY=your-tmdb-key-here
VITE_MAPBOX_ACCESS_TOKEN=your-mapbox-token-here
OPENAI_API_KEY=your-openai-key-here
```

**Important**: Set these for **Production** environment and redeploy.

### 5. Configure Storage (Optional)

If you want image uploads:

1. **Go to Supabase** → **Storage**
2. **Create buckets**: `avatars`, `posts`, `messages`
3. **Set bucket policies** (already included in SQL script)

## 🏗 Local Development

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd cineconnect
npm install
```

### 2. Environment Setup

Create `.env` file:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_TMDB_API_KEY=your-tmdb-key-here
VITE_MAPBOX_ACCESS_TOKEN=your-mapbox-token-here
OPENAI_API_KEY=your-openai-key-here
```

### 3. Database Setup

Run the `production_database_complete.sql` script in your Supabase SQL Editor.

### 4. Start Development

```bash
npm run dev
```

## 📱 Features Guide

### 🎬 Movies
- Browse trending movies from TMDB
- Search by title, genre, or year
- View detailed movie information
- Add movies to favorites

### 💬 Chat
- WhatsApp-style interface
- Real-time messaging
- User search by username/email
- Online status indicators
- Read receipts
- Image sharing

### 🤖 AI Assistant
- OpenAI-powered responses
- Platform-specific guidance
- Movie recommendations
- General assistance

### 📍 Location
- Interactive Mapbox map
- Share your location
- Find nearby users
- Location-based features

### 📱 Social Feed
- Create posts with images
- Like and comment system
- Follow/unfollow users
- Real-time notifications

## 🔧 Configuration

### Database Schema

The complete database schema includes:
- User management with profiles
- Real-time messaging system
- Social feed with posts/comments/likes
- Location sharing
- Notifications system
- File storage policies

### Security Features

- Row Level Security (RLS) on all tables
- Secure API key management
- Input validation and sanitization
- XSS protection
- Secure file upload policies

## 🚀 Performance Optimizations

- Code splitting with React lazy loading
- Image optimization and lazy loading
- Efficient database queries with indexes
- Real-time subscriptions optimization
- Mobile-first responsive design

## 🐛 Troubleshooting

### Common Issues:

1. **Database connection errors**: Check Supabase URL and keys
2. **Real-time not working**: Verify RLS policies are set correctly
3. **Movies not loading**: Check TMDB API key
4. **Map not displaying**: Verify Mapbox token
5. **AI not responding**: Check OpenAI API key and Netlify function

### Debug Steps:

1. Check browser console for errors
2. Verify environment variables in Netlify
3. Check Supabase logs for database issues
4. Test API endpoints manually

## 📄 License

MIT License - feel free to use for personal and commercial projects.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For issues and questions:
- Check the troubleshooting section
- Open an issue on GitHub
- Check Supabase and Netlify documentation

---

**Built with ❤️ using React, Supabase, and modern web technologies.**
