export default function ResultPage() {
  return (
    <main>
      <div className="card">
        <span className="badge eligible">PROCEED</span>
        <h1>Application result</h1>
        <h3>What is established</h3>
        <ul>
          <li>Identity verified</li>
          <li>Enrollment confirmed</li>
        </ul>
        <h3>What is unresolved</h3>
        <ul>
          <li>Income documentation still needs review</li>
        </ul>
        <h3>Conflicts or problems</h3>
        <ul>
          <li>None identified</li>
        </ul>
        <h3>Next action</h3>
        <p>Provide any final supporting proof required by the reviewer.</p>
      </div>
    </main>
  );
}
