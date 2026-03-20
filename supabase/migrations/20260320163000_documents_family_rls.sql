-- Migration to secure the documents table and allow family-based sharing as requested.
-- 1. Enable RLS on documents
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- 2. Drop any existing restrictive policies if they exist (to avoid duplicates)
DROP POLICY IF EXISTS "Users can view own documents" ON documents;
DROP POLICY IF EXISTS "Users can view family documents" ON documents;
DROP POLICY IF EXISTS "Users can insert family documents" ON documents;
DROP POLICY IF EXISTS "Users can update own documents" ON documents;
DROP POLICY IF EXISTS "Users can delete own documents" ON documents;

-- 3. Policy: View documents 
-- Allow users to view their own documents, AND documents of users who share their family_id.
CREATE POLICY "Users can view family documents" 
ON documents FOR SELECT 
TO authenticated 
USING (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM profiles AS me 
    JOIN profiles AS other ON me.family_id = other.family_id 
    WHERE me.id = auth.uid() AND other.id = documents.user_id 
    AND me.family_id IS NOT NULL
  )
);

-- 4. Policy: Insert documents 
-- Allow uploading for oneself OR for any user belonging to the same family group.
CREATE POLICY "Users can insert family documents" 
ON documents FOR INSERT 
TO authenticated 
WITH CHECK (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM profiles AS me 
    JOIN profiles AS other ON me.family_id = other.family_id 
    WHERE me.id = auth.uid() AND other.id = documents.user_id 
    AND me.family_id IS NOT NULL
  )
);

-- 5. Policy: Maintenance (Update/Delete)
-- Only the owner (the user whose profile it belongs to) can rename or delete it.
-- This ensures that family members can share but not destructively edit.
CREATE POLICY "Users can update own documents" 
ON documents FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents" 
ON documents FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- Note: No family insertion policy is added for the "reports" table.
-- This keeps the "upload reports" feature individual-only, ensuring that only the specific user 
-- can scan and save medical reports for themselves, avoiding unauthorized report tampering.
