export default function ReviewerQueuePage() {
  return (
    <main>
      <div className="card">
        <h1>Reviewer queue</h1>
        <div className="grid">
          <div className="card">
            <span className="badge review">HUMAN_REVIEW</span>
            <h3>Scholarship application 1024</h3>
            <p>Conflicting enrollment evidence</p>
          </div>
          <div className="card">
            <span className="badge warning">NEEDS_INFORMATION</span>
            <h3>Scholarship application 1042</h3>
            <p>Missing income proof</p>
          </div>
        </div>
      </div>
    </main>
  );
}
