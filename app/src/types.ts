// Domain types.
// Mirror the Supabase schema but use camelCase + ms timestamps locally.

export type PostStatus = "draft" | "published";

export interface Post {
  id: number;
  title: string;
  slug: string;
  type: string;                 // free-form collection name (hokum, journal, brief, …)
  status: PostStatus | null;
  publishedAt: number | null;
  excerpt: string | null;
  category: string | null;
  content: string;              // Markdown body (content_md in the DB)
  notionId: string | null;
  favorited: boolean;
  collectionSeq: number | null; // 1-based position inside its collection
  wordCount: number | null;
  createdAt: number;
  updatedAt: number;
  // sync metadata, local-only
  syncedAt?: number | null;
  dirty?: boolean;
}

export interface Collection {
  name: string;
  emoji: string | null;
  description: string | null;
  position: number;
  createdAt: number;
  updatedAt: number;
  syncedAt?: number | null;
  dirty?: boolean;
}

export interface PostVersion {
  id: string;
  postId: number;
  version: number;
  content: string;
  attributes: Record<string, unknown>;
  createdAt: number;
  createdBy: "user" | "mcp:claude-code" | "migration";
  message: string | null;
}
