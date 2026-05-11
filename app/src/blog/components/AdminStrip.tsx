// Floating "Back to admin" pill, bottom-right of every public page.
// Only renders when the user has touched /admin in this browser
// (localStorage flag set by EditorApp + the sidebar Preview link).

export function AdminStrip() {
  const known =
    typeof localStorage !== "undefined" &&
    localStorage.getItem("verbatim:admin-known") === "1";
  if (!known) return null;
  return (
    <a href="/admin" className="blog-admin-fab" aria-label="Back to admin">
      ← Admin
    </a>
  );
}
