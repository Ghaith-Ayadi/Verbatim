import { useEffect } from "react";
import "./styles.css";
import { useBlogData } from "./data";
import { useBlogRoute } from "./route";
import { Home } from "./components/Home";
import { Reader } from "./components/Reader";
import { AdminStrip } from "./components/AdminStrip";
import { installSettings, useSetting } from "@/lib/settings";

export function BlogApp() {
  const [route] = useBlogRoute();
  const { loading, collections, posts, error } = useBlogData();
  const faviconUrl = useSetting<string | null>("favicon.url", null);
  const siteTitle = useSetting<string>("site.title", "Verbatim");

  useEffect(() => {
    void installSettings();
  }, []);

  useEffect(() => {
    if (typeof document === "undefined" || !faviconUrl) return;
    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = faviconUrl;
  }, [faviconUrl]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (siteTitle && route.view === "home") document.title = siteTitle;
  }, [siteTitle, route.view]);

  if (error) {
    return (
      <div className="blog-app">
        <AdminStrip />
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

  return (
    <>
      <AdminStrip />
      {route.view === "post" ? (
        <Reader slug={route.slug} />
      ) : (
        <Home collections={collections} posts={posts} />
      )}
    </>
  );
}
