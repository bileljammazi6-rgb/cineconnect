-- URGENT MIGRATION: Fix column name mismatch in messages table
-- This fixes the "column recipient_id does not exist" error

-- Step 1: Check current table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'messages' 
AND table_schema = 'public';

-- Step 2: Rename the column if it exists as recipient_id
DO $$
BEGIN
    -- Check if recipient_id exists and receiver_id doesn't
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'messages' 
        AND column_name = 'recipient_id' 
        AND table_schema = 'public'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'messages' 
        AND column_name = 'receiver_id' 
        AND table_schema = 'public'
    ) THEN
        -- Rename the column
        ALTER TABLE messages RENAME COLUMN recipient_id TO receiver_id;
        RAISE NOTICE 'Column renamed from recipient_id to receiver_id';
    ELSE
        RAISE NOTICE 'Column renaming not needed or already done';
    END IF;
END
$$;

-- Step 3: Add missing fields if they don't exist
DO $$
BEGIN
    -- Add read column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'messages' 
        AND column_name = 'read' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE messages ADD COLUMN read boolean DEFAULT false;
        RAISE NOTICE 'Added read column to messages table';
    END IF;
    
    -- Add last_seen column to users if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'last_seen' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE users ADD COLUMN last_seen timestamptz;
        RAISE NOTICE 'Added last_seen column to users table';
    END IF;
END
$$;

-- Step 4: Update indexes
DO $$
BEGIN
    -- Drop old index if it exists
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_messages_recipient_id') THEN
        DROP INDEX idx_messages_recipient_id;
        RAISE NOTICE 'Dropped old recipient_id index';
    END IF;
    
    -- Create new index if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_messages_receiver_id') THEN
        CREATE INDEX idx_messages_receiver_id ON messages(receiver_id);
        RAISE NOTICE 'Created new receiver_id index';
    END IF;
    
    -- Create read column index if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_messages_read') THEN
        CREATE INDEX idx_messages_read ON messages(read);
        RAISE NOTICE 'Created read column index';
    END IF;
    
    -- Create last_seen index if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_users_last_seen') THEN
        CREATE INDEX idx_users_last_seen ON users(last_seen);
        RAISE NOTICE 'Created last_seen index';
    END IF;
END
$$;

-- Step 5: Update RLS policies to use correct column name
DO $$
BEGIN
    -- Drop old policies if they exist
    DROP POLICY IF EXISTS "Users can view their own messages" ON messages;
    DROP POLICY IF EXISTS "Users can send messages" ON messages;
    DROP POLICY IF EXISTS "Users can delete their own sent messages" ON messages;
    
    -- Create updated policies with correct column names
    CREATE POLICY "Users can view their own messages"
        ON messages
        FOR SELECT
        TO authenticated
        USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

    CREATE POLICY "Users can send messages"
        ON messages
        FOR INSERT
        TO authenticated
        WITH CHECK (auth.uid() = sender_id);

    CREATE POLICY "Users can update message read status"
        ON messages
        FOR UPDATE
        TO authenticated
        USING (auth.uid() = receiver_id)
        WITH CHECK (auth.uid() = receiver_id);

    CREATE POLICY "Users can delete their own sent messages"
        ON messages
        FOR DELETE
        TO authenticated
        USING (auth.uid() = sender_id);
        
    RAISE NOTICE 'Updated RLS policies with correct column names';
END
$$;

-- Step 6: Verify the fix
SELECT 
    'messages' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'messages' 
AND table_schema = 'public'
AND column_name IN ('sender_id', 'receiver_id', 'recipient_id', 'read')
ORDER BY column_name;

SELECT 'Migration completed successfully!' as status;