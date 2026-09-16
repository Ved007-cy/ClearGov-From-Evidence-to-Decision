import Link from 'next/link';

export default function ApplicantStartPage() {
  return (
    <main>
      <div className="card">
        <span className="badge">Student Scholarship Assistance</span>
        <h1>Before you begin</h1>
        <ul>
          <li>We will review identity, enrollment, residency, income, and consent.</li>
          <li>Required evidence must be clear, current, and readable.</li>
          <li>Missing or conflicting evidence may result in a follow-up request or human review.</li>
        </ul>
        <Link href="/apply/scholarship_assistance/details">
          <button>Continue</button>
        </Link>
      </div>
    </main>
  );
}
