import { useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useHotkeys } from "react-hotkeys-hook";
import { AuthGate } from "@/components/AuthGate";
import { Sidebar } from "@/components/Sidebar";
import { Editor } from "@/components/Editor";
import { AttributePanel } from "@/components/AttributePanel";
import { CommandPalette } from "@/components/CommandPalette";
import { PostListView } from "@/components/PostListView";
import { db } from "@/lib/db";
import { useRoute } from "@/lib/route";
import { useLayout } from "@/lib/layout";
import { installLifecycleHandlers, setSyncUser, runSync, flushSync } from "@/lib/sync";
import { startRealtime, stopRealtime } from "@/lib/realtime";
import { installSearchIndex } from "@/lib/search";
import { useSession } from "@/lib/auth";
import { snapshotVersion } from "@/lib/versions";

export default function App() {
  return (
    <AuthGate>
      <Shell />
    </AuthGate>
  );
}

function Shell() {
  const { session } = useSession();
  const [route] = useRoute();
  const [layout, , toggleAuthorMode] = useLayout();

  // Wire one-time effects
  useEffect(() => {
    installLifecycleHandlers();
    installSearchIndex();
  }, []);

  // Re-init sync + realtime when session changes
  useEffect(() => {
    if (!session) return;
    // Single-tenant: pretend the Payload-managed integer id is 1.
    // The sync engine doesn't filter by user, since this DB belongs to one person.
    setSyncUser(1);
    void runSync();
    startRealtime();
    return () => {
      void flushSync();
      stopRealtime();
      setSyncUser(null);
    };
  }, [session?.user?.id]);

  useHotkeys("mod+\\", (e) => {
    e.preventDefault();
    toggleAuthorMode();
  });

  const currentPost = useLiveQuery(
    () => (route.view === "post" ? db.posts.where("slug").equals(route.slug).first() : undefined),
    [route.view === "post" ? route.slug : null],
  );

  useHotkeys(
    "mod+shift+s",
    async (e) => {
      e.preventDefault();
      if (currentPost) await snapshotVersion(currentPost, "user", "Manual snapshot");
    },
    [currentPost?.id, currentPost?.content],
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {layout.sidebar && <Sidebar currentSlug={route.view === "post" ? route.slug : null} />}
      <main className="flex-1 overflow-y-auto">
        {route.view === "list" && <PostListView />}
        {route.view === "post" && !currentPost && (
          <div className="flex h-full items-center justify-center text-fg-faint">
            Post not found.
          </div>
        )}
        {route.view === "post" && currentPost && <Editor post={currentPost} />}
      </main>
      {layout.attributes && route.view === "post" && currentPost && (
        <AttributePanel post={currentPost} />
      )}
      <CommandPalette currentPostId={currentPost?.id ?? null} />
    </div>
  );
}
