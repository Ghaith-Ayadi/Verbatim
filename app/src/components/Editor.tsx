import { useEffect, useRef } from "react";
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import "@blocknote/mantine/style.css";
import type { Post } from "@/types";
import { updatePost } from "@/lib/posts";
import { uploadFile } from "@/lib/uploads";
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
    <div className="mx-auto h-full max-w-[760px] px-8 py-12">
      <input
        value={post.title}
        onChange={(e) => void updatePost(post.id, { title: e.target.value })}
        placeholder="Untitled"
        className="mb-6 w-full bg-transparent font-serif text-4xl outline-none placeholder:text-fg-faint"
      />
      <div ref={editorRootRef}>
        <BlockNoteView editor={editor} theme="dark" />
        <WikilinkAutocomplete rootRef={editorRootRef} />
      </div>
    </div>
  );
}
