// Uploads a file to the `verbatim` Supabase Storage bucket.
// Returns the public URL.

import { supabase } from "@/lib/supabase";

const BUCKET = "verbatim";

export async function uploadFile(file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "bin";
  const safeName = file.name
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "file";
  const path = `${new Date().getFullYear()}/${Date.now().toString(36)}-${safeName}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "31536000",
    upsert: false,
    contentType: file.type || undefined,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
