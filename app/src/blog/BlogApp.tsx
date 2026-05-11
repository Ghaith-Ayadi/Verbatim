import "./styles.css";
import { useBlogData } from "./data";
import { useBlogRoute } from "./route";
import { Home } from "./components/Home";
import { Reader } from "./components/Reader";

export function BlogApp() {
  const [route] = useBlogRoute();
  const { loading, collections, posts, error } = useBlogData();

  if (error) {
    return (
      <div className="blog-app">
        <div className="blog-article">
          <h1>Something broke.</h1>
          <p className="dek">{error}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div
        className="blog-app"
        style={{
          display: "grid",
          placeItems: "center",
          height: "100vh",
          color: "var(--mute)",
          fontSize: 12,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
        }}
      >
        Loading…
      </div>
    );
  }

  if (route.view === "post") {
    return <Reader slug={route.slug} />;
  }
  return <Home collections={collections} posts={posts} />;
}
