import { useBlogRoute } from "@/blog/route";

export function Masthead() {
  const [, navigate] = useBlogRoute();
  return (
    <header className="blog-masthead">
      <a
        href="/"
        className="blog-wordmark"
        aria-label="Verbatim — home"
        onClick={(e) => {
          e.preventDefault();
          navigate({ view: "home" });
        }}
      >
        Verbatim
      </a>
      <nav className="blog-mast-nav">
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            navigate({ view: "home" });
          }}
        >
          Index
        </a>
        <a
          href={`mailto:hello@verbatim.example?subject=${encodeURIComponent("Subscribe to Verbatim")}`}
        >
          Subscribe
        </a>
      </nav>
    </header>
  );
}
