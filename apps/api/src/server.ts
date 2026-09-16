import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { createScholarshipScenario, evaluateScenario, hashInput } from '@cleargov/decision-engine';
import type { ApplicantFacts, EvidenceFact, Scenario } from '@cleargov/contracts';

const app = Fastify({ logger: false });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseUrl && supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey)
  : null;

await app.register(cors, {
  origin: process.env.CORS_ORIGINS?.split(',').map((origin) => origin.trim()) ?? true
});

const scenario = createScholarshipScenario();

app.get('/health', async () => ({ ok: true }));

app.get('/api/v1/scenarios', async () => ({
  data: [scenario],
  requestId: crypto.randomUUID()
}));

app.post('/api/v1/applications', async (request, reply) => {
  if (!supabase) {
    return reply.code(503).send({
      error: 'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY for the API.',
      requestId: crypto.randomUUID()
    });
  }

  const parsed = z.object({
    publicReference: z.string().min(1).max(100),
    fullName: z.string().min(1).max(200),
    dateOfBirth: z.string().min(1).max(30),
    householdIncome: z.string().min(1).max(50),
    consent: z.boolean()
  }).safeParse((request as any).body);

  if (!parsed.success) {
    return reply.code(400).send({
      error: 'Application details are invalid.',
      details: parsed.error.flatten(),
      requestId: crypto.randomUUID()
    });
  }

  const applicationData = parsed.data;
  const timestamp = new Date().toISOString();
  const { data: application, error: applicationError } = await supabase
    .from('applications')
    .upsert({
      public_reference: applicationData.publicReference,
      status: 'DRAFT',
      updated_at: timestamp
    }, { onConflict: 'public_reference' })
    .select('id, public_reference')
    .single();

  if (applicationError || !application) {
    request.log.error(applicationError);
    return reply.code(500).send({
      error: 'The application could not be saved to Supabase.',
      requestId: crypto.randomUUID()
    });
  }

  const { error: profileError } = await supabase
    .from('applicant_profiles')
    .upsert({
      application_id: application.id,
      non_sensitive_normalized_fields: {
        fullName: applicationData.fullName,
        dateOfBirth: applicationData.dateOfBirth,
        householdIncome: applicationData.householdIncome
      },
      consent_at: applicationData.consent ? timestamp : null
    }, { onConflict: 'application_id' });

  if (profileError) {
    request.log.error(profileError);
    return reply.code(500).send({
      error: 'The applicant profile could not be saved to Supabase.',
      requestId: crypto.randomUUID()
    });
  }

  return reply.code(200).send({
    data: { publicReference: application.public_reference },
    requestId: crypto.randomUUID()
  });
});

app.post('/api/v1/applications/:publicReference/assess', async (request, reply) => {
  const body = (request as any).body ?? {};
  const applicantFacts: ApplicantFacts = {
    identityEstablished: !!body.identityEstablished,
    enrolledInEligibleInstitution: body.enrolledInEligibleInstitution ?? null,
    residencySatisfied: body.residencySatisfied ?? null,
    householdIncomeBelowThreshold: body.householdIncomeBelowThreshold ?? null,
    consentPresent: !!body.consentPresent
  };

  const evidenceFacts: EvidenceFact[] = Array.isArray(body.evidenceFacts)
    ? body.evidenceFacts.map((fact: any) => ({
        field: fact.field,
        value: fact.value,
        confidence: Number(fact.confidence ?? 0.9),
        evidenceRef: fact.evidenceRef ?? 'evidence-1',
        source: fact.source ?? 'fixture'
      }))
    : [];

  const input = { scenario, applicantFacts, evidenceFacts, inputHash: hashInput({ scenario, applicantFacts, evidenceFacts, inputHash: '' }) };
  const result = evaluateScenario(scenario, applicantFacts, evidenceFacts);

  await reply.code(200);
  return {
    data: {
      ...result,
      inputHash: input.inputHash,
      scenarioKey: scenario.key
    },
    requestId: crypto.randomUUID()
  };
});

const start = async () => {
  try {
    await app.listen({ port: Number(process.env.PORT ?? 3001), host: '0.0.0.0' });
    console.log('API listening on http://localhost:3001');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

start();
