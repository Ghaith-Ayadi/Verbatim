import { useEffect, useState } from "react";
import { HelpCircle, XClose } from "@untitledui/icons";

interface Shortcut {
  keys: string[];
  label: string;
}

const SECTIONS: { heading: string; items: Shortcut[] }[] = [
  {
    heading: "Global",
    items: [
      { keys: ["⌘", "K"], label: "Command palette" },
      { keys: ["⌘", "⇧", "N"], label: "New post in current collection" },
      { keys: ["⌘", "⇧", "S"], label: "Snapshot a version" },
      { keys: ["⌘", "\\"], label: "Toggle author mode" },
      { keys: ["⌘", "⇧", "L"], label: "Toggle light / dark theme" },
      { keys: ["esc"], label: "Close palette / dialog" },
    ],
  },
  {
    heading: "Palette",
    items: [
      { keys: ["/"], label: "Switch to commands" },
      { keys: ["↑", "↓"], label: "Navigate" },
      { keys: ["↵"], label: "Select" },
    ],
  },
  {
    heading: "Editor",
    items: [
      { keys: ["[["], label: "Wikilink autocomplete" },
      { keys: ["↑", "↓"], label: "Prev / next post (header buttons)" },
      { keys: ["⌘", "B"], label: "Bold" },
      { keys: ["⌘", "I"], label: "Italic" },
      { keys: ["#"], label: "Heading (line start)" },
      { keys: ["- "], label: "Bullet list (line start)" },
      { keys: [">"], label: "Quote (line start)" },
    ],
  },
];

export function HelpFab() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label="Keyboard shortcuts"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-30 flex h-11 w-11 items-center justify-center rounded-full border border-secondary bg-secondary text-secondary shadow-lg ring-1 ring-primary transition hover:bg-primary_hover hover:text-primary"
      >
        <HelpCircle className="size-5" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-overlay/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-[480px] max-w-[92vw] overflow-hidden rounded-xl border border-secondary bg-secondary shadow-2xl ring-1 ring-primary"
          >
            <div className="flex items-center justify-between border-b border-secondary px-5 py-3">
              <h2 className="text-sm font-semibold text-primary">Keyboard shortcuts</h2>
              <button
                aria-label="Close"
                onClick={() => setOpen(false)}
                className="rounded-md p-1 text-quaternary transition hover:bg-primary_hover hover:text-secondary"
              >
                <XClose className="size-4" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto px-5 py-4 text-sm">
              {SECTIONS.map((s) => (
                <section key={s.heading} className="mb-5 last:mb-0">
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-quaternary">
                    {s.heading}
                  </h3>
                  <ul className="space-y-1.5">
                    {s.items.map((it, i) => (
                      <li
                        key={i}
                        className="flex items-center justify-between gap-4 text-secondary"
                      >
                        <span>{it.label}</span>
                        <span className="flex shrink-0 items-center gap-1">
                          {it.keys.map((k, j) => (
                            <Kbd key={j}>{k}</Kbd>
                          ))}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-secondary bg-primary px-1.5 font-mono text-[11px] font-medium text-secondary">
      {children}
    </kbd>
  );
}
