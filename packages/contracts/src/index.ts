export const SCENARIO_KEYS = {
  scholarship: 'scholarship_assistance'
} as const;

export type DecisionCode = 'PROCEED' | 'NOT_ELIGIBLE' | 'NEEDS_INFORMATION' | 'HUMAN_REVIEW';
export type FindingStatus =
  | 'SATISFIED'
  | 'NOT_SATISFIED'
  | 'MISSING'
  | 'UNREADABLE'
  | 'CONFLICT'
  | 'EXPIRED'
  | 'HUMAN_REVIEW'
  | 'NOT_APPLICABLE';

export type ScenarioCondition = {
  code: string;
  label: string;
  description: string;
  required: boolean;
  evidenceRequirements: string[];
  ruleType: string;
  orderIndex: number;
  ruleVersion: string;
};

export type Scenario = {
  id: string;
  key: string;
  name: string;
  description: string;
  version: string;
  active: boolean;
  conditions: ScenarioCondition[];
};

export type ApplicantFacts = {
  identityEstablished: boolean;
  enrolledInEligibleInstitution: boolean | null;
  residencySatisfied: boolean | null;
  householdIncomeBelowThreshold: boolean | null;
  consentPresent: boolean;
};

export type EvidenceFact = {
  field: string;
  value: unknown;
  confidence: number;
  evidenceRef: string;
  source: string;
};

export type AssessmentFinding = {
  conditionCode: string;
  label: string;
  status: FindingStatus;
  explanation: string;
  evidenceRefs: string[];
};

export type NextAction = {
  priority: number;
  actionCode: string;
  label: string;
  instructions: string;
  owner: 'APPLICANT' | 'REVIEWER';
};

export type DecisionExplanation = {
  decision: DecisionCode;
  summary: string;
  established: AssessmentFinding[];
  unresolved: AssessmentFinding[];
  contradictions: Array<{
    field: string;
    values: unknown[];
    evidenceRefs: string[];
    action: string;
  }>;
  nextActions: NextAction[];
  engineVersion: string;
  assessmentId: string;
};

export type AssessmentInput = {
  scenario: Scenario;
  applicantFacts: ApplicantFacts;
  evidenceFacts: EvidenceFact[];
  inputHash: string;
};
