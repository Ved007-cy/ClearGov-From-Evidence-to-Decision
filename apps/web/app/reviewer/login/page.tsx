export default function ReviewerLoginPage() {
  return (
    <main>
      <div className="card">
        <h1>Reviewer login</h1>
        <form>
          <label>
            Email
            <input name="email" placeholder="reviewer@cleargov.local" />
          </label>
          <label>
            Password
            <input type="password" name="password" placeholder="Password" />
          </label>
          <button type="button">Sign in</button>
        </form>
      </div>
    </main>
  );
}
