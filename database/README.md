# CineConnect Database Schema

This folder contains the database schema for CineConnect.

## Files

- **`schema.sql`** - Complete production database schema including:
  - All tables with relationships and constraints
  - Row Level Security (RLS) policies  
  - Indexes for performance optimization
  - Triggers and functions for automation
  - Storage bucket policies for file uploads

## Setup Instructions

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** in your Supabase dashboard
3. Copy and paste the entire content from `schema.sql`
4. Run the script to create all database objects
5. **(Optional)** For better performance, run `VACUUM ANALYZE;` separately

The script is idempotent and safe to run multiple times.

### Performance Optimization

After running the main schema, optionally run this command separately for better performance:

```sql
VACUUM ANALYZE;
```

This command optimizes the database tables and updates statistics for the query planner.

## What's Created

- **9 tables**: users, messages, posts, comments, follows, notifications, etc.
- **Security policies**: Comprehensive RLS for all tables
- **Performance indexes**: Optimized for real-time queries
- **Storage buckets**: For avatars, posts, and message images
- **Triggers**: Automatic data consistency and updates