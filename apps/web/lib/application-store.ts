export type ApplicationDraft = {
  publicReference: string;
  fullName: string;
  dateOfBirth: string;
  householdIncome: string;
  consent: boolean;
  evidenceSubmittedAt?: string;
  updatedAt?: string;
};

const STORAGE_KEY = 'cleargov-application-draft';

const emptyDraft: ApplicationDraft = {
  publicReference: 'demo-1024',
  fullName: '',
  dateOfBirth: '',
  householdIncome: '',
  consent: false
};

export function getApplicationDraft(): ApplicationDraft {
  if (typeof window === 'undefined') {
    return emptyDraft;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return emptyDraft;
    }

    return { ...emptyDraft, ...(JSON.parse(raw) as Partial<ApplicationDraft>) };
  } catch {
    return emptyDraft;
  }
}

export async function persistApplicationDraft(draft: ApplicationDraft) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001'}/api/v1/applications`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft)
    }
  );

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? 'Application could not be saved.');
  }
}

export function saveApplicationDraft(partial: Partial<ApplicationDraft>) {
  if (typeof window === 'undefined') {
    return;
  }

  const current = getApplicationDraft();
  const next = {
    ...current,
    ...partial,
    updatedAt: new Date().toISOString()
  };

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function clearApplicationDraft() {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
}
