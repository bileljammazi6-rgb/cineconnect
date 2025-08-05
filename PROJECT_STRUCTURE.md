# CineConnect Project Structure

```
cineconnect/
├── database/                   # Database schema and setup
│   ├── README.md              # Database setup instructions
│   └── schema.sql             # Complete Supabase schema
├── netlify/                   # Netlify deployment configuration
│   └── functions/             # Serverless functions
│       └── chatbot.js         # OpenAI API proxy function
├── src/                       # React application source code
│   ├── components/            # React components
│   │   ├── Admin/             # Admin dashboard components
│   │   ├── Auth/              # Authentication components
│   │   ├── Chat/              # Chat and messaging components
│   │   ├── Layout/            # Navigation and layout components
│   │   ├── Location/          # Map and location components
│   │   ├── Movies/            # Movie discovery components
│   │   ├── Notifications/     # Notification components
│   │   ├── Profile/           # User profile components
│   │   ├── Quotes/            # Quotes section components
│   │   ├── Search/            # Search functionality components
│   │   └── Social/            # Social feed components
│   ├── hooks/                 # Custom React hooks
│   │   ├── useAuth.ts         # Authentication hook
│   │   └── useLocation.ts     # Location services hook
│   ├── lib/                   # Utility libraries
│   │   └── supabase.ts        # Supabase client configuration
│   ├── App.tsx                # Main application component
│   ├── main.tsx               # Application entry point
│   └── index.css              # Global styles
├── .env.example               # Environment variables template
├── .gitignore                 # Git ignore rules
├── README.md                  # Project documentation
├── index.html                 # HTML entry point
├── package.json               # Node.js dependencies and scripts
├── postcss.config.js          # PostCSS configuration
├── tailwind.config.js         # Tailwind CSS configuration
├── tsconfig.json              # TypeScript configuration
├── vite.config.ts             # Vite build tool configuration
└── eslint.config.js           # ESLint configuration
```

## Key Directories

### `/database`
Contains the complete Supabase database schema with all tables, policies, indexes, and functions needed for the application.

### `/src/components`
Organized by feature area:
- **Auth**: Login, registration, password reset
- **Chat**: Real-time messaging, user search, WhatsApp-style interface  
- **Movies**: TMDB integration, search, favorites
- **Social**: Posts, comments, likes, following system
- **Location**: Interactive map with user locations
- **Profile**: User profiles and settings

### `/netlify/functions`
Serverless functions for secure API proxying:
- **chatbot.js**: Securely handles OpenAI API requests

### `/src/hooks`
Custom React hooks for:
- **useAuth**: Authentication state and methods
- **useLocation**: Geolocation services

### `/src/lib`
Core utilities:
- **supabase.ts**: Database client with optimized configuration

## Clean Architecture

- **47 total files** (excluding dependencies)
- **No test files** or build artifacts committed
- **Organized by feature** for easy maintenance
- **TypeScript** for type safety
- **ESLint** for code quality
- **Tailwind** for consistent styling

## Deployment Ready

- All unnecessary files removed
- Environment variables properly configured
- Database schema organized and documented
- Netlify functions ready for serverless deployment