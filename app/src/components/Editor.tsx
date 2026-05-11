import { useEffect, useMemo, useRef } from "react";
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import "@blocknote/mantine/style.css";
import { useLiveQuery } from "dexie-react-hooks";
import { ArrowLeft, ArrowDown, ArrowUp } from "@untitledui/icons";
import type { Post } from "@/types";
import { db } from "@/lib/db";
import { updatePost } from "@/lib/posts";
import { uploadFile } from "@/lib/uploads";
import { go } from "@/lib/route";
import { collectionDisplay } from "@/lib/collections";
import type { Collection } from "@/types";
import { WikilinkAutocomplete } from "@/components/WikilinkAutocomplete";

interface Props {
  post: Post;
}

const SAVE_DEBOUNCE_MS = 100;

export function Editor({ post }: Props) {
  const editor = useCreateBlockNote({ uploadFile });
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
    <div className="mx-auto h-full max-w-[760px] px-10 py-8">
      <PostNav post={post} />
      <input
        value={post.title}
        onChange={(e) => void updatePost(post.id, { title: e.target.value })}
        placeholder="Untitled"
        className="mb-8 w-full bg-transparent font-serif text-4xl leading-tight text-primary outline-none placeholder:text-quaternary"
      />
      <div ref={editorRootRef}>
        <BlockNoteView editor={editor} theme="dark" />
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

  return (
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
      </div>
    </div>
  );
}
