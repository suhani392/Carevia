-- Enable Supabase Realtime for the alerts_and_actions table
-- This allows our React Native app to subscribe to new inserts in real-time.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'alerts_and_actions'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts_and_actions;
    END IF;
END $$;
