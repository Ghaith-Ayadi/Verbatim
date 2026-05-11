import { navigateTo } from "@/blog/route";
import { Wordmark } from "./Wordmark";

interface Props {
  backLabel?: string | null;
  onBack?: () => void;
  right?: React.ReactNode;
  /** 0..100 — when set, a 2px progress line is drawn at the bottom edge of the bar. */
  progress?: number;
}

/**
 * Single top bar used everywhere on the public site. Wordmark stays
 * centered; left + right slots float on either side. Reading progress
 * (when on a post) is drawn at the bottom edge of the bar.
 */
export function Topbar({ backLabel, onBack, right, progress }: Props) {
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
        className="blog-topbar__brand"
        aria-label="Verbatim — home"
      >
        <Wordmark height={18} />
        <span className="blog-topbar__dot" aria-hidden />
      </a>
      <div className="blog-topbar__right">{right}</div>
      {progress != null && (
        <div
          className="blog-topbar__progress"
          style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
        />
      )}
    </header>
  );
}
