"use client";

import { type ChangeEvent, type FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getApplicationDraft, saveApplicationDraft } from '../../../../lib/application-store';

type UploadedDocument = {
  fileName: string;
  size: string;
};

const evidenceRequirements = [
  { key: 'identity', label: 'Identity proof', helper: 'Government ID or passport photo page' },
  { key: 'enrollment', label: 'Enrollment proof', helper: 'School acceptance or current enrollment letter' },
  { key: 'income', label: 'Income proof', helper: 'Latest payslip, benefits letter, or tax notice' }
];

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function EvidencePage() {
  const router = useRouter();
  const [draft, setDraft] = useState(getApplicationDraft());
  const [documents, setDocuments] = useState<Record<string, UploadedDocument>>({});

  useEffect(() => {
    setDraft(getApplicationDraft());
  }, []);

  const handleFileChange = (key: string) => (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setDocuments((previous) => ({
      ...previous,
      [key]: {
        fileName: file.name,
        size: formatFileSize(file.size)
      }
    }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const updated = {
      ...draft,
      evidenceSubmittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setDraft(updated);
    saveApplicationDraft(updated);
    router.push('/application/demo-1024/assessment');
  };

  return (
    <main className="evidence-page">
      <section className="evidence-shell">
        <header className="evidence-intro">
          <span className="badge">Step 2 of 3</span>
          <h1>Upload your supporting evidence</h1>
          <p>
            Help us verify your application with a few key documents. Keep files clear,
            readable, and in PDF, JPG, or PNG format.
          </p>
        </header>

        <div className="evidence-grid">
          <div className="card evidence-panel">
            <div className="section-header">
              <span className="kicker">Required documents</span>
              <h2>Eligibility review pack</h2>
            </div>

            <form onSubmit={handleSubmit} className="evidence-form">
              <div className="upload-grid">
                {evidenceRequirements.map((item, index) => {
                  const uploaded = documents[item.key];

                  return (
                    <div className="upload-card" key={item.key}>
                      <div className="upload-card-header">
                        <div className="upload-title-wrap">
                          <span className="upload-index">{index + 1}</span>
                          <div>
                            <h3>{item.label}</h3>
                            <p>{item.helper}</p>
                          </div>
                        </div>

                        <span className={`status-badge ${uploaded ? 'ready' : 'pending'}`}>
                          {uploaded ? 'Ready' : 'Required'}
                        </span>
                      </div>

                      <label htmlFor={`upload-${item.key}`} className="file-dropzone">
                        <input
                          id={`upload-${item.key}`}
                          type="file"
                          accept="application/pdf,image/png,image/jpeg"
                          onChange={handleFileChange(item.key)}
                        />

                        <div className="dropzone-visual">{uploaded ? '✓' : 'PDF'}</div>

                        <div className="dropzone-copy">
                          <strong>{uploaded ? uploaded.fileName : 'Choose a file'}</strong>
                          <small>
                            {uploaded
                              ? `${uploaded.size} uploaded`
                              : 'PNG, JPG, or PDF up to 10MB'}
                          </small>
                        </div>
                      </label>
                    </div>
                  );
                })}
              </div>

              <div className="actions">
                <button type="button" className="secondary" onClick={() => router.back()}>
                  Back
                </button>
                <button type="submit">Submit evidence</button>
              </div>
            </form>
          </div>

          <aside className="card evidence-sidebar">
            <span className="kicker">Applicant</span>
            <h3>{draft.fullName || 'Applicant profile in progress'}</h3>

            <div className="mini-panel">
              <p className="mini-title">Review summary</p>
              <ul>
                <li>Identity and enrollment details are checked for eligibility</li>
                <li>Income figures are verified against household guidance</li>
                <li>Assessments are typically reviewed within 48 hours</li>
              </ul>
            </div>

            <div className="checklist-panel">
              <p className="mini-title">Before you upload</p>
              <ul className="check-list">
                <li>Use clear photos with good contrast</li>
                <li>Make sure the file is not password protected</li>
                <li>Only upload the most recent supporting document</li>
              </ul>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
