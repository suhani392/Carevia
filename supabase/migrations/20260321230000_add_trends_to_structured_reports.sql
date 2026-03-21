-- 📈 Add Health Trends Persistent Storage to Structured Reports
ALTER TABLE structured_reports 
ADD COLUMN IF NOT EXISTS trends_json JSONB DEFAULT '[]'::JSONB;

ALTER TABLE structured_reports 
ADD COLUMN IF NOT EXISTS comparison_context TEXT;

-- 🛡️ Update indexing for faster lookups
CREATE INDEX IF NOT EXISTS idx_structured_reports_user_id ON structured_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_structured_reports_patient_name ON structured_reports(patient_name);
CREATE INDEX IF NOT EXISTS idx_structured_reports_report_date ON structured_reports(report_date DESC);
