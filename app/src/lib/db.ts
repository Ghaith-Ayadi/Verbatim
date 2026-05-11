import Dexie, { type Table } from "dexie";
import type { Collection, Post, PostVersion } from "@/types";

interface SyncMetaRow {
  key: string;
  value: unknown;
}

class VerbatimDB extends Dexie {
  posts!: Table<Post, number>;
  versions!: Table<PostVersion, string>;
  collections!: Table<Collection, string>;
  syncMeta!: Table<SyncMetaRow, string>;

  constructor() {
    super("verbatim-db");

    // v1: initial schema with a separate `collections` table.
    this.version(1).stores({
      posts: "id, slug, status, type, favorited, collectionId, updatedAt, publishedAt",
      collections: "id, position, createdAt",
      versions: "id, postId, [postId+version], createdAt",
      syncMeta: "key",
    });

    // v2: collections dropped — `type` carried the identity.
    this.version(2).stores({
      posts: "id, slug, status, type, favorited, updatedAt, publishedAt",
      collections: null,
      versions: "id, postId, [postId+version], createdAt",
      syncMeta: "key",
    });

    // v3: ephemeral collectionMeta (color-only); never shipped.
    this.version(3).stores({
      posts: "id, slug, status, type, favorited, updatedAt, publishedAt",
      versions: "id, postId, [postId+version], createdAt",
      collectionMeta: "name, updatedAt",
      syncMeta: "key",
    });

    // v4: real `collections` with name PK + emoji + description + position.
    this.version(4).stores({
      posts: "id, slug, status, type, favorited, updatedAt, publishedAt",
      versions: "id, postId, [postId+version], createdAt",
      collectionMeta: null,
      collections: "name, position, updatedAt",
      syncMeta: "key",
    });
  }
}

export const db = new VerbatimDB();
