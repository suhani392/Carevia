-- Migration to add identity and chronological metadata to structured reports.
-- This enables accurate trend analysis and identity-based saving logic.

ALTER TABLE structured_reports 
ADD COLUMN IF NOT EXISTS patient_name TEXT,
ADD COLUMN IF NOT EXISTS report_date DATE;

-- Add an index for faster historical lookups by name
CREATE INDEX IF NOT EXISTS idx_structured_reports_patient_name ON structured_reports(patient_name);
CREATE INDEX IF NOT EXISTS idx_structured_reports_userId_name ON structured_reports(user_id, patient_name);
