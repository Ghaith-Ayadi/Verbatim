// A 28px-tall bar that appears at the top of the public site for visitors
// who've used /admin in this browser (flagged in localStorage). Slips out of
// the way for actual readers.

export function AdminStrip() {
  const known = typeof localStorage !== "undefined" && localStorage.getItem("verbatim:admin-known") === "1";
  if (!known) return null;

  return (
    <div
      style={{
        background: "var(--ink)",
        color: "var(--paper)",
        fontFamily: "var(--ui)",
        fontSize: 11,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        textAlign: "center",
        padding: "6px 16px",
      }}
    >
      <a href="/admin" style={{ color: "inherit", textDecoration: "none" }}>
        ← Back to admin
      </a>
    </div>
  );
}
