CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'APPLICANT',
  organization_id UUID REFERENCES organizations(id),
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT '1.0.0',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS scenario_conditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID REFERENCES scenarios(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT NOT NULL,
  required BOOLEAN NOT NULL DEFAULT true,
  rule_type TEXT NOT NULL,
  rule_config_json JSONB NOT NULL DEFAULT '{}',
  order_index INTEGER NOT NULL,
  UNIQUE (scenario_id, code)
);

CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  public_reference TEXT NOT NULL UNIQUE,
  scenario_id UUID REFERENCES scenarios(id),
  applicant_user_id UUID REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'DRAFT',
  decision TEXT,
  decision_version TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS applicant_profiles (
  application_id UUID PRIMARY KEY REFERENCES applications(id) ON DELETE CASCADE,
  encrypted_personal_fields JSONB,
  non_sensitive_normalized_fields JSONB,
  consent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  condition_id UUID REFERENCES scenario_conditions(id),
  storage_key TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  safe_filename TEXT NOT NULL,
  detected_mime TEXT,
  size_bytes BIGINT,
  sha256 TEXT,
  scan_status TEXT NOT NULL DEFAULT 'RECEIVED',
  processing_status TEXT NOT NULL DEFAULT 'RECEIVED',
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS evidence_facts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_id UUID REFERENCES evidence(id) ON DELETE CASCADE,
  field TEXT NOT NULL,
  normalized_value_json JSONB,
  confidence DOUBLE PRECISION NOT NULL DEFAULT 0,
  source_location TEXT,
  extraction_method TEXT,
  extraction_version TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  engine_version TEXT NOT NULL,
  input_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  decision TEXT,
  confidence DOUBLE PRECISION,
  explanation_json JSONB,
  next_action_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS assessment_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
  condition_id UUID REFERENCES scenario_conditions(id),
  status TEXT NOT NULL,
  severity TEXT,
  reason_code TEXT,
  explanation TEXT,
  evidence_ids_json JSONB,
  missing_items_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reviewer_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  reason TEXT,
  prior_state_json JSONB,
  new_state_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID,
  organization_id UUID REFERENCES organizations(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  request_id TEXT,
  outcome TEXT NOT NULL,
  metadata_json_redacted JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  previous_hash TEXT,
  event_hash TEXT
);

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS idempotency_keys (
  key TEXT PRIMARY KEY,
  user_id UUID,
  route TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  response_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenario_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE applicant_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_facts ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviewer_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE idempotency_keys ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_scenarios_active ON scenarios(active, key);
CREATE INDEX IF NOT EXISTS idx_apps_public_reference ON applications(public_reference);
CREATE INDEX IF NOT EXISTS idx_apps_org_creator ON applications(scenario_id, status, created_at);
CREATE INDEX IF NOT EXISTS idx_evidence_application ON evidence(application_id, scan_status, processing_status);
CREATE INDEX IF NOT EXISTS idx_assessments_application ON assessments(application_id, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_events_created_at ON audit_events(created_at DESC);
