import { describe, expect, it } from 'vitest';
import { createScholarshipScenario, evaluateScenario, hashInput } from './index';

const scenario = createScholarshipScenario();

const baseFacts = {
  identityEstablished: true,
  enrolledInEligibleInstitution: true,
  residencySatisfied: true,
  householdIncomeBelowThreshold: true,
  consentPresent: true
};

describe('decision-engine', () => {
  it('returns PROCEED when all required conditions are satisfied', () => {
    const result = evaluateScenario(scenario, baseFacts, [
      { field: 'identity_established', value: 'passport', confidence: 0.98, evidenceRef: 'e1', source: 'fixture' },
      { field: 'enrollment_eligible', value: 'enrolled', confidence: 0.94, evidenceRef: 'e2', source: 'fixture' },
      { field: 'residency_requirement', value: 'resident', confidence: 0.92, evidenceRef: 'e3', source: 'fixture' },
      { field: 'income_threshold', value: 32000, confidence: 0.9, evidenceRef: 'e4', source: 'fixture' },
      { field: 'required_consent', value: true, confidence: 0.99, evidenceRef: 'e5', source: 'fixture' }
    ]);

    expect(result.decision).toBe('PROCEED');
    expect(result.established.length).toBeGreaterThan(0);
    expect(result.nextActions[0].actionCode).toBe('APPROVE');
  });

  it('returns NEEDS_INFORMATION when evidence is missing', () => {
    const result = evaluateScenario(scenario, {
      ...baseFacts,
      householdIncomeBelowThreshold: null
    }, []);

    expect(result.decision).toBe('NEEDS_INFORMATION');
  });

  it('returns HUMAN_REVIEW when evidence confidence is low', () => {
    const result = evaluateScenario(scenario, baseFacts, [
      { field: 'enrollment_eligible', value: 'indeterminate', confidence: 0.2, evidenceRef: 'conflict-1', source: 'fixture' }
    ]);

    expect(result.decision).toBe('HUMAN_REVIEW');
    expect(result.contradictions.length).toBeGreaterThan(0);
  });

  it('returns NOT_ELIGIBLE when a required condition is clearly false', () => {
    const result = evaluateScenario(scenario, {
      ...baseFacts,
      residencySatisfied: false
    }, []);

    expect(result.decision).toBe('NOT_ELIGIBLE');
  });

  it('creates a stable hash for the same input', () => {
    const input = {
      scenario,
      applicantFacts: baseFacts,
      evidenceFacts: [{ field: 'income_threshold', value: 31000, confidence: 0.9, evidenceRef: 'e4', source: 'fixture' }],
      inputHash: ''
    };

    expect(hashInput(input)).toBe(hashInput(input));
  });
});
