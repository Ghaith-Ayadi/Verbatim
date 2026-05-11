interface Props {
  postCount: number;
  collectionCount: number;
  lastUpdate: number | null;
}

function fmtDate(ms: number | null): string {
  if (ms == null) return "—";
  const d = new Date(ms);
  const day = String(d.getDate()).padStart(2, "0");
  const mon = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][d.getMonth()];
  return `${day} ${mon} ${d.getFullYear()}`;
}

export function Hero({ postCount, collectionCount, lastUpdate }: Props) {
  return (
    <section className="blog-hero">
      <h1>
        A reading <em>room.</em>
      </h1>
      <p className="lede">
        Long-form notes, briefs, and unfinished thoughts. Updated when there is something
        actually worth saying, and not before.
      </p>
      <div className="meta">
        <span>
          <b>{postCount}</b> posts
        </span>
        <span>
          <b>{collectionCount}</b> collections
        </span>
        <span>
          Est. <b>MMXXII</b>
        </span>
        {lastUpdate && (
          <span>
            Last update <b>{fmtDate(lastUpdate)}</b>
          </span>
        )}
      </div>
    </section>
  );
}
