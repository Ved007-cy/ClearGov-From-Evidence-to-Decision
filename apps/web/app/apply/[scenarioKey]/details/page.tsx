"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getApplicationDraft, persistApplicationDraft, saveApplicationDraft } from '../../../../lib/application-store';

export default function DetailsPage() {
  const params = useParams();
  const router = useRouter();
  const scenarioKey = typeof params?.scenarioKey === 'string' ? params.scenarioKey : 'scholarship_assistance';
  const [form, setForm] = useState(getApplicationDraft());
  const [saveError, setSaveError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const saved = getApplicationDraft();
    setForm(saved);
  }, []);

  const handleChange = (field: keyof typeof form, value: string | boolean) => {
    const next = { ...form, [field]: value };
    setForm(next);
    saveApplicationDraft(next);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaveError('');
    setIsSaving(true);
    saveApplicationDraft(form);

    try {
      await persistApplicationDraft(form);
      router.push(`/apply/${scenarioKey}/evidence`);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Application could not be saved.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main>
      <div className="card">
        <h1>Applicant details</h1>
        <form onSubmit={handleSubmit}>
          <label>
            Full name
            <input
              name="fullName"
              value={form.fullName}
              onChange={(event) => handleChange('fullName', event.target.value)}
              placeholder="Enter full name"
            />
          </label>
          <label>
            Date of birth
            <input
              name="dateOfBirth"
              type="date"
              value={form.dateOfBirth}
              onChange={(event) => handleChange('dateOfBirth', event.target.value)}
            />
          </label>
          <label>
            Household income
            <input
              name="householdIncome"
              value={form.householdIncome}
              onChange={(event) => handleChange('householdIncome', event.target.value)}
              placeholder="e.g. 32500"
            />
          </label>
          <label>
            Consent
            <input
              type="checkbox"
              name="consent"
              checked={form.consent}
              onChange={(event) => handleChange('consent', event.target.checked)}
            />
          </label>
          {saveError && <p role="alert">{saveError}</p>}
          <button type="submit" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save and continue'}
          </button>
        </form>
      </div>
    </main>
  );
}
