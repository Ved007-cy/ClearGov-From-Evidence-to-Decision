import Link from 'next/link';

export default function Page() {
  return (
    <main>
      <section className="hero">
        <div>
          <span className="kicker">ClearGov</span>
          <h1>Evidence-based decisions for public services</h1>
          <p>
            Applicants submit service information and proof, then receive a clear explanation of what is
            established, what is missing, what is conflicting, and which next action is required.
          </p>

          <div className="actions">
            <Link href="/services"><button>View services</button></Link>
            <Link href="/apply/scholarship_assistance/start"><button className="secondary">Start application</button></Link>
          </div>
        </div>

        <div className="card hero-visual" aria-label="ClearGov dashboard preview">
          <div className="dashboard-card">
            <div className="badge eligible">Proceed</div>
            <h3 style={{ marginTop: '1rem' }}>School support review</h3>
            <p>Completed with verified evidence and a clear next step.</p>
            <div className="mock-chart" aria-hidden="true" />
          </div>
        </div>
      </section>

      <div className="feature-list">
        <div className="section-header">
          <span className="kicker">How it works</span>
          <h2>Transparent, explainable decisions</h2>
        </div>

        <div className="grid">
          <div className="card">
            <h3>Applicant journey</h3>
            <p>Information → Evidence → Assessment → Decision → Next action</p>
          </div>
          <div className="card">
            <h3>Reviewer workflow</h3>
            <p>Conflict review, reasoned actions, and a structured audit trail.</p>
          </div>
          <div className="card">
            <h3>Deterministic engine</h3>
            <p>Rules are versioned and produce explainable decisions based on proof.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
