-- Create trend_cache table if not exists
CREATE TABLE IF NOT EXISTS public.trend_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    structured_report_id UUID REFERENCES public.structured_reports(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    test_name TEXT NOT NULL,
    previous_value NUMERIC,
    current_value NUMERIC,
    trend_status TEXT NOT NULL, -- 'Increased', 'Decreased', 'Stable'
    percentage_change NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.trend_cache ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own trends
CREATE POLICY "Users can view own trend cache" ON public.trend_cache
    FOR SELECT USING (auth.uid() = user_id);

-- Allow the edge functions (service role) to manage trends
CREATE POLICY "Service role can manage trend cache" ON public.trend_cache
    USING (true)
    WITH CHECK (true);
