-- Add user_id to trend_cache for easier RLS
ALTER TABLE trend_cache 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Enable RLS on all AI tables
ALTER TABLE structured_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE trend_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE general_ai_conversations ENABLE ROW LEVEL SECURITY;

-- structured_reports: users can see their own reports
CREATE POLICY "Users can view own structured reports" 
on structured_reports for select 
using (auth.uid() = user_id);

-- trend_cache: users can see their own trends
CREATE POLICY "Users can view own trends" 
on trend_cache for select 
using (auth.uid() = user_id);

-- ai_conversations: users can see their own chat history
CREATE POLICY "Users can view own report chats" 
on ai_conversations for select 
using (auth.uid() = user_id);

CREATE POLICY "Users can insert own report chats" 
on ai_conversations for insert 
with check (auth.uid() = user_id);

-- general_ai_conversations: users can see their own general chat history
CREATE POLICY "Users can view own general chats" 
on general_ai_conversations for select 
using (auth.uid() = user_id);

CREATE POLICY "Users can insert own general chats" 
on general_ai_conversations for insert 
with check (auth.uid() = user_id);
