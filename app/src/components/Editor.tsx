import { useEffect, useMemo, useRef, useState } from "react";
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import "@blocknote/mantine/style.css";
import { useLiveQuery } from "dexie-react-hooks";
import { ArrowLeft, ArrowDown, ArrowUp, Copy04, DotsHorizontal, Trash01 } from "@untitledui/icons";
import type { Post } from "@/types";
import { db } from "@/lib/db";
import { deletePost, duplicatePost, updatePost } from "@/lib/posts";
import { uploadFile } from "@/lib/uploads";
import { go } from "@/lib/route";
import { collectionDisplay } from "@/lib/collections";
import { useTheme } from "@/lib/theme";
import type { Collection } from "@/types";
import { WikilinkAutocomplete } from "@/components/WikilinkAutocomplete";
import { ActionMenu } from "@/components/Menu";
import { ConfirmDialog } from "@/components/ConfirmDialog";

interface Props {
  post: Post;
}

const SAVE_DEBOUNCE_MS = 100;

export function Editor({ post }: Props) {
  const editor = useCreateBlockNote({ uploadFile });
  const [theme] = useTheme();
  const lastLoadedId = useRef<number | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load post content into editor when switching documents — same editor instance.
  useEffect(() => {
    if (!editor) return;
    if (lastLoadedId.current === post.id) return;
    lastLoadedId.current = post.id;
    void (async () => {
      const blocks = await editor.tryParseMarkdownToBlocks(post.content || "");
      editor.replaceBlocks(editor.document, blocks);
    })();
  }, [editor, post.id, post.content]);

  // Save on change: debounce 100ms to IDB; sync engine pushes to Supabase on 2s idle.
  useEffect(() => {
    if (!editor) return;
    const unsub = editor.onChange(() => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        const md = await editor.blocksToMarkdownLossy();
        await updatePost(post.id, { content: md });
      }, SAVE_DEBOUNCE_MS);
    });
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      if (typeof unsub === "function") unsub();
    };
  }, [editor, post.id]);

  const editorRootRef = useRef<HTMLDivElement | null>(null);

  return (
    <div className="mx-auto w-full max-w-[760px] px-10 py-8">
      <PostNav post={post} />
      <input
        value={post.title}
        onChange={(e) => void updatePost(post.id, { title: e.target.value })}
        placeholder="Untitled"
        className="mb-8 w-full bg-transparent font-title text-4xl leading-tight text-primary outline-none placeholder:text-quaternary"
      />
      <div ref={editorRootRef} className="w-full">
        <BlockNoteView editor={editor} theme={theme} />
        <WikilinkAutocomplete rootRef={editorRootRef} />
      </div>
    </div>
  );
}

function PostNav({ post }: { post: Post }) {
  const peers = useLiveQuery(
    () => db.posts.where("type").equals(post.type).toArray(),
    [post.type],
    [] as Post[],
  );
  const collections = useLiveQuery(
    () => db.collections.toArray(),
    [],
    [] as Collection[],
  );
  const sorted = useMemo(
    () =>
      [...peers].sort((a, b) => (a.collectionSeq ?? 0) - (b.collectionSeq ?? 0)),
    [peers],
  );
  const idx = sorted.findIndex((p) => p.id === post.id);
  const prev = idx > 0 ? sorted[idx - 1] : null;
  const next = idx >= 0 && idx < sorted.length - 1 ? sorted[idx + 1] : null;
  const display = collectionDisplay(post.type, collections);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function onDuplicate() {
    const dup = await duplicatePost(post);
    if (dup) go({ view: "post", id: dup.id });
  }

  async function onDelete() {
    await deletePost(post.id);
    // After delete, fall back to the next or prev post in the collection,
    // or go home if this was the last one.
    const fallback = next ?? prev;
    if (fallback) go({ view: "post", id: fallback.id });
    else go({ view: "list" });
  }

  return (
    <>
      <div className="mb-8 flex items-center justify-between text-xs text-tertiary">
        <button
          type="button"
          onClick={() => go({ view: "list" })}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 transition hover:bg-primary_hover hover:text-secondary"
        >
          <ArrowLeft className="size-3.5" />
          {display.emoji && <span className="text-sm leading-none">{display.emoji}</span>}
          <span>{display.label || post.type || "Home"}</span>
        </button>
        <div className="flex items-center gap-1">
          <span className="date-pill mr-2 text-quaternary">
            #{post.collectionSeq ?? "—"} of {sorted.length}
          </span>
          <button
            type="button"
            aria-label="Previous post"
            disabled={!prev}
            onClick={() => prev && go({ view: "post", id: prev.id })}
            className="rounded-md p-1.5 text-tertiary transition hover:bg-primary_hover hover:text-secondary disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ArrowUp className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Next post"
            disabled={!next}
            onClick={() => next && go({ view: "post", id: next.id })}
            className="rounded-md p-1.5 text-tertiary transition hover:bg-primary_hover hover:text-secondary disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ArrowDown className="size-4" />
          </button>
          <div className="ml-1">
            <ActionMenu
              trigger={<DotsHorizontal className="size-4" data-icon />}
              items={[
                {
                  id: "duplicate",
                  label: "Duplicate",
                  icon: <Copy04 className="size-4" />,
                  onAction: () => void onDuplicate(),
                },
                {
                  id: "delete",
                  label: "Delete",
                  icon: <Trash01 className="size-4" />,
                  destructive: true,
                  onAction: () => setConfirmDelete(true),
                },
              ]}
            />
          </div>
        </div>
      </div>
      {confirmDelete && (
        <ConfirmDialog
          title={`Delete "${post.title || "Untitled"}"?`}
          message="The post and all of its versions will be permanently deleted."
          confirmLabel="Delete post"
          destructive
          onClose={() => setConfirmDelete(false)}
          onConfirm={() => void onDelete()}
        />
      )}
    </>
  );
}
