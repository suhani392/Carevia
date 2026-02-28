-- Stage 1: OCR Storage
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS raw_text TEXT;

-- Stage 2: Structural Single Source of Truth
CREATE TABLE IF NOT EXISTS structured_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  parsed_json JSONB,
  explanation_json JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Stage 3: Deterministic Trend Engine
CREATE TABLE IF NOT EXISTS trend_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  structured_report_id UUID REFERENCES structured_reports(id) ON DELETE CASCADE,
  test_name TEXT,
  previous_value FLOAT,
  current_value FLOAT,
  trend_status TEXT, -- Improved, Worsened, Stable
  percentage_change FLOAT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
