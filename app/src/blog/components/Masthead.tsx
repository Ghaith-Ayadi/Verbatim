export function Masthead() {
  return (
    <header className="blog-masthead">
      <a href="/" className="blog-wordmark" aria-label="Verbatim — home">
        Verbatim
      </a>
      <nav className="blog-mast-nav">
        <a href="/">Index</a>
        <a href="/p/about">About</a>
        <a href="#subscribe">Subscribe</a>
        <a href="/rss.xml">RSS</a>
      </nav>
    </header>
  );
}
