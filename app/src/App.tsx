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
import { installColorOverrides } from "@/lib/colors";
import { snapshotVersion } from "@/lib/versions";

export default function App() {
  return (
    <AuthGate>
      <Shell />
    </AuthGate>
  );
}

function Shell() {
  const [route] = useRoute();
  const [layout, , toggleAuthorMode] = useLayout();

  // Auth bypassed for now — sync runs unconditionally.
  useEffect(() => {
    installLifecycleHandlers();
    installSearchIndex();
    void installColorOverrides();
    setSyncUser(1);
    void runSync();
    startRealtime();
    return () => {
      void flushSync();
      stopRealtime();
      setSyncUser(null);
    };
  }, []);

  useHotkeys("mod+\\", (e) => {
    e.preventDefault();
    toggleAuthorMode();
  });

  const currentPost = useLiveQuery(
    () => (route.view === "post" ? db.posts.get(route.id) : undefined),
    [route.view === "post" ? route.id : null],
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
      {layout.sidebar && <Sidebar currentId={route.view === "post" ? route.id : null} />}
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
