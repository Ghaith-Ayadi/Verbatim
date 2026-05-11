import { navigateTo } from "@/blog/route";

interface Props {
  /** Show a "← Back" affordance on the left. */
  backLabel?: string | null;
  onBack?: () => void;
  /** Right-side content (read-time, date, etc). */
  right?: React.ReactNode;
}

/**
 * Single top bar used everywhere on the public site. Wordmark stays
 * centered; left + right slots float on either side.
 */
export function Topbar({ backLabel, onBack, right }: Props) {
  return (
    <header className="blog-topbar">
      <div className="blog-topbar__left">
        {backLabel && (
          <button
            type="button"
            className="blog-topbar__back"
            onClick={onBack ?? (() => navigateTo({ view: "home" }))}
          >
            ← {backLabel}
          </button>
        )}
      </div>
      <a
        href="/"
        onClick={(e) => {
          e.preventDefault();
          navigateTo({ view: "home" });
        }}
        className="blog-wordmark blog-topbar__brand"
        aria-label="Verbatim — home"
      >
        Verbatim
      </a>
      <div className="blog-topbar__right">{right}</div>
    </header>
  );
}
