-- Add Agent UI state fields to existing reports table
ALTER TABLE reports
ADD COLUMN IF NOT EXISTS risk_classification TEXT DEFAULT 'Unknown',
ADD COLUMN IF NOT EXISTS report_confidence TEXT DEFAULT 'Unknown',
ADD COLUMN IF NOT EXISTS escalation_status TEXT DEFAULT 'None';

-- Create table to store the undeniable Reasoning Trail of agents
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
  agent_name TEXT,
  event_type TEXT,
  decision_reason TEXT,
  confidence TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own audit logs (via reports)
CREATE POLICY "Users can view audit logs for their reports"
ON audit_logs FOR SELECT
TO authenticated
USING (
  report_id IN (SELECT id FROM reports WHERE user_id = auth.uid())
);

-- Allow edge functions (service role) to insert audit logs
CREATE POLICY "Service roles can insert audit logs"
ON audit_logs FOR INSERT
TO service_role
WITH CHECK (true);

-- Create table to store agent-triggered actions and family escalations
CREATE TABLE IF NOT EXISTS alerts_and_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  risk_level TEXT,
  action_type TEXT,
  action_message TEXT,
  target_user_id UUID REFERENCES auth.users(id), -- For family escalation
  status TEXT DEFAULT 'Pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for alerts_and_actions
ALTER TABLE alerts_and_actions ENABLE ROW LEVEL SECURITY;

-- Allow users to view their alerts or alerts targeted to them
CREATE POLICY "Users can view their alerts"
ON alerts_and_actions FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR target_user_id = auth.uid()
);

-- Allow users to update alert status (e.g., mark as read/resolved)
CREATE POLICY "Users can update their alert status"
ON alerts_and_actions FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid() OR target_user_id = auth.uid()
);

-- Allow edge functions (service role) to insert alerts
CREATE POLICY "Service roles can insert alerts"
ON alerts_and_actions FOR INSERT
TO service_role
WITH CHECK (true);
