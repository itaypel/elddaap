import { SUPABASE_URL } from "./supabase/env";

/* Operator photos live in the public `operator-photos` bucket under <uid>/...; the
   database stores the object path and the app shows the public URL. Verification
   documents go to the private `operator-docs` bucket under the same folder layout. */

export const PHOTO_BUCKET = "operator-photos";
export const DOCS_BUCKET = "operator-docs";
export const MAX_PHOTOS = 10;
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

const publicPrefix = () => `${SUPABASE_URL}/storage/v1/object/public/${PHOTO_BUCKET}/`;

/** Stored value (object path or absolute URL) → URL an <img> can load. */
export const photoUrl = (stored: string) => (/^https?:\/\//.test(stored) ? stored : publicPrefix() + stored);

/** Displayed URL → value to store (object path when it is one of ours). */
export const photoPath = (url: string) => (url.startsWith(publicPrefix()) ? url.slice(publicPrefix().length) : url);

const SUPPORTED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/**
 * Validates an image and shrinks it to at most `maxDim` px on its longer side (WebP).
 * Returns a ready-to-upload blob, or an error sentence in Hebrew.
 */
export async function prepareImage(file: File, maxDim = 1600): Promise<{ blob: Blob; ext: string } | { error: string }> {
  if (!file.type.startsWith("image/")) return { error: `${file.name}: אפשר להעלות רק תמונות.` };
  if (file.type === "image/gif") {
    return file.size <= MAX_UPLOAD_BYTES ? { blob: file, ext: "gif" } : { error: `${file.name}: הקובץ גדול מ־5MB.` };
  }
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/webp", 0.85));
    if (blob && blob.type === "image/webp" && blob.size <= MAX_UPLOAD_BYTES) return { blob, ext: "webp" };
  } catch {
    /* fall through to the original file */
  }
  if (!SUPPORTED.includes(file.type)) return { error: `${file.name}: הפורמט לא נתמך. העלו JPG, PNG או WebP.` };
  if (file.size > MAX_UPLOAD_BYTES) return { error: `${file.name}: הקובץ גדול מ־5MB.` };
  return { blob: file, ext: file.type.split("/")[1].replace("jpeg", "jpg") };
}

export const randomName = (prefix: string, ext: string) => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}.${ext}`;
