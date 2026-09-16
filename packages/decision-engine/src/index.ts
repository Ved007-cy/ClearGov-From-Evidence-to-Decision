import type {
  ApplicantFacts,
  AssessmentInput,
  DecisionExplanation,
  EvidenceFact,
  FindingStatus,
  NextAction,
  Scenario,
  ScenarioCondition
} from '@cleargov/contracts';

const engineVersion = 'rules-1';

const normalizeBoolean = (value: unknown): boolean | null => {
  if (value === undefined || value === null) return null;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', 'yes', '1', 'y'].includes(normalized)) return true;
    if (['false', 'no', '0', 'n'].includes(normalized)) return false;
  }
  if (typeof value === 'number') return value === 1 ? true : value === 0 ? false : null;
  return null;
};

const findCondition = (scenario: Scenario, code: string): ScenarioCondition | undefined =>
  scenario.conditions.find((condition: ScenarioCondition) => condition.code === code);

const summarizeDecision = (decision: DecisionExplanation['decision']): string => {
  switch (decision) {
    case 'PROCEED':
      return 'The application meets the required conditions and can proceed.';
    case 'NOT_ELIGIBLE':
      return 'A required condition is not satisfied, so this application cannot proceed.';
    case 'NEEDS_INFORMATION':
      return 'The application is missing required information or evidence before it can proceed.';
    case 'HUMAN_REVIEW':
      return 'The application needs a reviewer because the evidence is conflicting or needs manual review.';
    default:
      return 'The application needs attention.';
  }
};

const computeNextActions = (decision: DecisionExplanation['decision']): NextAction[] => {
  if (decision === 'PROCEED') {
    return [
      {
        priority: 1,
        actionCode: 'APPROVE',
        label: 'Continue the application',
        instructions: 'Advance the application to the next stage.',
        owner: 'APPLICANT'
      }
    ];
  }

  if (decision === 'NOT_ELIGIBLE') {
    return [
      {
        priority: 1,
        actionCode: 'NOT_ELIGIBLE',
        label: 'Fix the ineligible condition',
        instructions: 'Confirm whether the required condition can be met or re-check the facts provided.',
        owner: 'APPLICANT'
      }
    ];
  }

  if (decision === 'HUMAN_REVIEW') {
    return [
      {
        priority: 1,
        actionCode: 'HUMAN_REVIEW',
        label: 'Request a reviewer decision',
        instructions: 'Send the application to a reviewer to confirm the conflicting evidence.',
        owner: 'REVIEWER'
      }
    ];
  }

  return [
    {
      priority: 1,
      actionCode: 'UPLOAD_MORE',
      label: 'Provide missing evidence',
      instructions: 'Upload the missing or unreadable proof and rerun the assessment.',
      owner: 'APPLICANT'
    }
  ];
};

const createFinding = (
  condition: ScenarioCondition,
  status: FindingStatus,
  explanation: string,
  evidenceRefs: string[] = []
) => ({
  conditionCode: condition.code,
  label: condition.label,
  status,
  explanation,
  evidenceRefs
});

export const hashInput = (input: AssessmentInput): string => {
  const encoded = JSON.stringify({
    scenario: input.scenario,
    applicantFacts: input.applicantFacts,
    evidenceFacts: input.evidenceFacts
  });

  let hash = 2166136261;
  for (let i = 0; i < encoded.length; i++) {
    const value = encoded.charCodeAt(i);
    hash ^= value;
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
};

export const evaluateScenario = (scenario: Scenario, applicantFacts: ApplicantFacts, evidenceFacts: EvidenceFact[]): DecisionExplanation => {
  const established: DecisionExplanation['established'] = [];
  const unresolved: DecisionExplanation['unresolved'] = [];
  const contradictions: DecisionExplanation['contradictions'] = [];

  const conditionStatusMap = new Map<string, FindingStatus>();
  const evidenceRefsByCondition = new Map<string, string[]>();

  for (const condition of scenario.conditions) {
    const refs = evidenceFacts
      .filter((fact: EvidenceFact) => fact.field.startsWith(condition.code.toLowerCase()) || fact.field.includes(condition.code.toLowerCase()))
      .map((fact: EvidenceFact) => fact.evidenceRef);
    evidenceRefsByCondition.set(condition.code, refs);
  }

  const identity = findCondition(scenario, 'identity_established');
  if (identity) {
    const status = applicantFacts.identityEstablished ? 'SATISFIED' : 'MISSING';
    conditionStatusMap.set(identity.code, status);
    if (applicantFacts.identityEstablished) {
      established.push(createFinding(identity, 'SATISFIED', 'Identity proof is present and accepted.', evidenceRefsByCondition.get(identity.code) ?? []));
    } else {
      unresolved.push(createFinding(identity, 'MISSING', 'Identity proof is required before the application can proceed.', evidenceRefsByCondition.get(identity.code) ?? []));
    }
  }

  const enrollment = findCondition(scenario, 'enrollment_eligible');
  if (enrollment) {
    const normalized = normalizeBoolean(applicantFacts.enrolledInEligibleInstitution);
    const status = normalized === true ? 'SATISFIED' : normalized === false ? 'NOT_SATISFIED' : 'MISSING';
    conditionStatusMap.set(enrollment.code, status);
    if (normalized === true) {
      established.push(createFinding(enrollment, 'SATISFIED', 'The applicant is enrolled at an eligible institution.', evidenceRefsByCondition.get(enrollment.code) ?? []));
    } else if (normalized === false) {
      unresolved.push(createFinding(enrollment, 'NOT_SATISFIED', 'The applicant is not enrolled in an eligible institution.', evidenceRefsByCondition.get(enrollment.code) ?? []));
    } else {
      unresolved.push(createFinding(enrollment, 'MISSING', 'Enrollment information is missing.', evidenceRefsByCondition.get(enrollment.code) ?? []));
    }
  }

  const residency = findCondition(scenario, 'residency_requirement');
  if (residency) {
    const normalized = normalizeBoolean(applicantFacts.residencySatisfied);
    const status = normalized === true ? 'SATISFIED' : normalized === false ? 'NOT_SATISFIED' : 'MISSING';
    conditionStatusMap.set(residency.code, status);
    if (normalized === true) {
      established.push(createFinding(residency, 'SATISFIED', 'Residency criteria are satisfied.', evidenceRefsByCondition.get(residency.code) ?? []));
    } else if (normalized === false) {
      unresolved.push(createFinding(residency, 'NOT_SATISFIED', 'Residency requirements are not met.', evidenceRefsByCondition.get(residency.code) ?? []));
    } else {
      unresolved.push(createFinding(residency, 'MISSING', 'Residency proof is missing.', evidenceRefsByCondition.get(residency.code) ?? []));
    }
  }

  const income = findCondition(scenario, 'income_threshold');
  if (income) {
    const normalized = normalizeBoolean(applicantFacts.householdIncomeBelowThreshold);
    const status = normalized === true ? 'SATISFIED' : normalized === false ? 'NOT_SATISFIED' : 'MISSING';
    conditionStatusMap.set(income.code, status);
    if (normalized === true) {
      established.push(createFinding(income, 'SATISFIED', 'Household income is below the required threshold.', evidenceRefsByCondition.get(income.code) ?? []));
    } else if (normalized === false) {
      unresolved.push(createFinding(income, 'NOT_SATISFIED', 'The household income is above the threshold.', evidenceRefsByCondition.get(income.code) ?? []));
    } else {
      unresolved.push(createFinding(income, 'MISSING', 'Income proof and threshold evidence are missing.', evidenceRefsByCondition.get(income.code) ?? []));
    }
  }

  const consent = findCondition(scenario, 'required_consent');
  if (consent) {
    const status = applicantFacts.consentPresent ? 'SATISFIED' : 'MISSING';
    conditionStatusMap.set(consent.code, status);
    if (applicantFacts.consentPresent) {
      established.push(createFinding(consent, 'SATISFIED', 'Consent was provided for this application.', evidenceRefsByCondition.get(consent.code) ?? []));
    } else {
      unresolved.push(createFinding(consent, 'MISSING', 'Consent is required before the application can proceed.', evidenceRefsByCondition.get(consent.code) ?? []));
    }
  }

  const hasConflict = evidenceFacts.some((fact) => fact.confidence < 0.5);
  if (hasConflict) {
    contradictions.push({
      field: 'evidence_confidence',
      values: evidenceFacts.filter((fact) => fact.confidence < 0.5).map((fact) => fact.value),
      evidenceRefs: evidenceFacts.filter((fact) => fact.confidence < 0.5).map((fact) => fact.evidenceRef),
      action: 'Request human review because the evidence confidence is too low to rely on.'
    });
  }

  let decision: DecisionExplanation['decision'] = 'PROCEED';
  const requiredConditions = scenario.conditions.filter((condition: ScenarioCondition) => condition.required);
  const isAnyMandatoryConflict = requiredConditions.some((condition: ScenarioCondition) => conditionStatusMap.get(condition.code) === 'CONFLICT' || conditionStatusMap.get(condition.code) === 'HUMAN_REVIEW');
  const isAnyMandatoryFalse = requiredConditions.some((condition: ScenarioCondition) => conditionStatusMap.get(condition.code) === 'NOT_SATISFIED');
  const isAnyMissing = requiredConditions.some((condition: ScenarioCondition) => conditionStatusMap.get(condition.code) === 'MISSING');

  if (isAnyMandatoryConflict || hasConflict) {
    decision = 'HUMAN_REVIEW';
  } else if (isAnyMandatoryFalse) {
    decision = 'NOT_ELIGIBLE';
  } else if (isAnyMissing) {
    decision = 'NEEDS_INFORMATION';
  }

  const explanation: DecisionExplanation = {
    decision,
    summary: summarizeDecision(decision),
    established,
    unresolved,
    contradictions,
    nextActions: computeNextActions(decision),
    engineVersion,
    assessmentId: `assessment-${Date.now()}`
  };

  return explanation;
};

export const createScholarshipScenario = (): Scenario => ({
  id: 'scenario-scholarship-1',
  key: 'scholarship_assistance',
  name: 'Student Scholarship Assistance',
  description: 'A public service application to review student scholarship eligibility.',
  version: '1.0.0',
  active: true,
  conditions: [
    {
      code: 'identity_established',
      label: 'Identity is established',
      description: 'The applicant must provide identity proof to verify their identity.',
      required: true,
      evidenceRequirements: ['government_id'],
      ruleType: 'identity',
      orderIndex: 1,
      ruleVersion: '1.0.0'
    },
    {
      code: 'enrollment_eligible',
      label: 'Enrollment status',
      description: 'The applicant must be enrolled in an eligible institution.',
      required: true,
      evidenceRequirements: ['enrollment_letter'],
      ruleType: 'eligibility',
      orderIndex: 2,
      ruleVersion: '1.0.0'
    },
    {
      code: 'residency_requirement',
      label: 'Residency requirement',
      description: 'The applicant must meet the residency requirement in the service area.',
      required: true,
      evidenceRequirements: ['residency_proof'],
      ruleType: 'residency',
      orderIndex: 3,
      ruleVersion: '1.0.0'
    },
    {
      code: 'income_threshold',
      label: 'Household income threshold',
      description: 'Household income must be below the configured threshold.',
      required: true,
      evidenceRequirements: ['income_proof'],
      ruleType: 'income',
      orderIndex: 4,
      ruleVersion: '1.0.0'
    },
    {
      code: 'required_consent',
      label: 'Required consent',
      description: 'The applicant must consent to the assessment and data processing.',
      required: true,
      evidenceRequirements: ['consent'],
      ruleType: 'consent',
      orderIndex: 5,
      ruleVersion: '1.0.0'
    }
  ]
});

export const decisionEngine = {
  createScholarshipScenario,
  evaluateScenario,
  hashInput,
  engineVersion
};

export default decisionEngine;
