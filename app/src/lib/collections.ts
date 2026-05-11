// Collection identity = a single text field (`posts.type`).
// Rule (Figma-style): if the name starts with an emoji, that emoji
// is the collection's visual identifier and the remainder is its label.

const segmenter =
  typeof Intl !== "undefined" && (Intl as unknown as { Segmenter?: typeof Intl.Segmenter }).Segmenter
    ? new Intl.Segmenter(undefined, { granularity: "grapheme" })
    : null;

const PICTO = /\p{Extended_Pictographic}/u;

export interface CollectionDisplay {
  emoji: string | null;
  label: string;
}

export function collectionDisplay(name: string | null | undefined): CollectionDisplay {
  if (!name) return { emoji: null, label: "" };

  // Find the first grapheme cluster — handles compound emoji (ZWJ, skin tone,
  // variation selector) as a single unit. Fall back to a simple char split if
  // Intl.Segmenter isn't around.
  let first: string;
  if (segmenter) {
    const it = segmenter.segment(name)[Symbol.iterator]();
    const step = it.next() as IteratorResult<{ segment: string }>;
    first = step.done ? "" : step.value.segment;
  } else {
    first = name[0] ?? "";
  }

  if (first && PICTO.test(first)) {
    return { emoji: first, label: name.slice(first.length).trim() };
  }
  return { emoji: null, label: name };
}
