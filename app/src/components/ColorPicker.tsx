import { useEffect, useRef, useState } from "react";
import { Check, XClose } from "@untitledui/icons";
import {
  PALETTE,
  clearCollectionColor,
  collectionColor,
  isCollectionColorOverridden,
  setCollectionColor,
  useColorVersion,
} from "@/lib/colors";

interface Props {
  collection: string;
}

export function ColorPicker({ collection }: Props) {
  useColorVersion();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const current = collectionColor(collection);
  const overridden = isCollectionColorOverridden(collection);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        aria-label={`Change color for ${collection}`}
        onClick={() => setOpen((o) => !o)}
        className="flex h-4 w-4 items-center justify-center rounded-full ring-1 ring-primary transition hover:scale-110"
        style={{ backgroundColor: current }}
      />
      {open && (
        <div className="absolute left-0 z-30 mt-2 w-[208px] rounded-xl border border-secondary bg-secondary p-2.5 shadow-xl ring-1 ring-primary">
          <div className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-wider text-quaternary">
            Color for {collection}
          </div>
          <div className="grid grid-cols-6 gap-1.5">
            {PALETTE.map((s) => {
              const selected = s.hex.toLowerCase() === current.toLowerCase();
              return (
                <button
                  key={s.name}
                  type="button"
                  aria-label={s.name}
                  onClick={() => {
                    void setCollectionColor(collection, s.hex);
                    setOpen(false);
                  }}
                  className="flex h-7 w-7 items-center justify-center rounded-full transition hover:scale-110"
                  style={{ backgroundColor: s.hex }}
                >
                  {selected && <Check className="size-4 text-white drop-shadow" />}
                </button>
              );
            })}
          </div>
          {overridden && (
            <button
              type="button"
              onClick={() => {
                void clearCollectionColor(collection);
                setOpen(false);
              }}
              className="mt-2 flex w-full items-center justify-center gap-1 rounded-md px-2 py-1.5 text-xs text-tertiary hover:bg-primary_hover hover:text-secondary"
            >
              <XClose className="size-3.5" />
              Reset to default
            </button>
          )}
        </div>
      )}
    </div>
  );
}
