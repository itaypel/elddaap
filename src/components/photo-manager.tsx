"use client";

import { useState } from "react";
import { ArrowRight, ImagePlus, Loader2, Star, Trash2, UserRound } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { MAX_PHOTOS, PHOTO_BUCKET, photoPath, photoUrl, prepareImage, randomName } from "@/lib/photos";
import { useStore } from "@/lib/store";
import { cx } from "./ui";

export type PhotoSet = { logo: string | null; photos: string[] };

/** Uploads one image to the caller's folder in the public photos bucket. Returns its public URL. */
export async function uploadPhoto(uid: string, file: File, kind: "logo" | "gallery"): Promise<{ url: string } | { error: string }> {
  const prepared = await prepareImage(file, kind === "logo" ? 512 : 1600);
  if ("error" in prepared) return prepared;
  const path = `${uid}/${randomName(kind, prepared.ext)}`;
  const { error } = await supabaseBrowser().storage.from(PHOTO_BUCKET).upload(path, prepared.blob, { contentType: prepared.blob.type || `image/${prepared.ext}`, cacheControl: "31536000" });
  if (error) return { error: `${file.name}: ההעלאה נכשלה. נסו שוב.` };
  return { url: photoUrl(path) };
}

/** Best-effort removal of files we own and no longer reference. */
async function removeObjects(uid: string, urls: string[]) {
  const paths = urls.map(photoPath).filter((p) => p.startsWith(`${uid}/`));
  if (paths.length) await supabaseBrowser().storage.from(PHOTO_BUCKET).remove(paths);
}

/**
 * Logo + activity gallery editor. `onChange` may persist and return false on failure;
 * files dropped from the set are deleted from storage only after it succeeds.
 */
export function PhotoManager({
  uid,
  value,
  onChange,
  galleryId = "photos",
  error,
}: {
  uid: string;
  value: PhotoSet;
  onChange: (next: PhotoSet) => boolean | Promise<boolean>;
  galleryId?: string;
  error?: React.ReactNode;
}) {
  const toast = useStore((s) => s.toast);
  const [busy, setBusy] = useState<"logo" | "gallery" | null>(null);

  const commit = async (next: PhotoSet) => {
    const ok = await onChange(next);
    if (ok) {
      const keep = new Set([next.logo, ...next.photos]);
      void removeObjects(uid, [value.logo, ...value.photos].filter((u): u is string => !!u && !keep.has(u)));
    }
    return ok;
  };

  const addLogo = async (file: File | undefined) => {
    if (!file) return;
    setBusy("logo");
    const res = await uploadPhoto(uid, file, "logo");
    setBusy(null);
    if ("error" in res) return toast(res.error, "danger");
    if (!(await commit({ ...value, logo: res.url }))) void removeObjects(uid, [res.url]);
  };

  const addPhotos = async (list: FileList | null) => {
    const files = Array.from(list ?? []).slice(0, MAX_PHOTOS - value.photos.length);
    if (!files.length) {
      if (list?.length) toast(`אפשר עד ${MAX_PHOTOS} תמונות.`, "danger");
      return;
    }
    setBusy("gallery");
    const results = await Promise.all(files.map((f) => uploadPhoto(uid, f, "gallery")));
    setBusy(null);
    const added = results.flatMap((r) => ("url" in r ? [r.url] : []));
    results.forEach((r) => "error" in r && toast(r.error, "danger"));
    if ((list?.length ?? 0) > files.length) toast(`נוספו ${files.length} תמונות. אפשר עד ${MAX_PHOTOS}.`, "neutral");
    if (added.length && !(await commit({ ...value, photos: [...value.photos, ...added] }))) void removeObjects(uid, added);
  };

  const move = (i: number, to: number) => {
    const next = [...value.photos];
    const [item] = next.splice(i, 1);
    next.splice(to, 0, item);
    void commit({ ...value, photos: next });
  };

  const full = value.photos.length >= MAX_PHOTOS;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-4">
        <div className="grid size-24 shrink-0 place-items-center overflow-hidden rounded-2xl border border-line bg-sunken">
          {value.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value.logo} alt="הלוגו של העסק" className="size-full object-cover" />
          ) : (
            <UserRound aria-hidden className="size-9 text-subtle" />
          )}
        </div>
        <div className="flex flex-col gap-2">
          <p className="font-bold">לוגו או תמונת פרופיל</p>
          <p className="text-[13px] text-muted">תמונה מרובעת נראית הכי טוב. מופיעה ליד שם העסק.</p>
          <div className="flex flex-wrap gap-2">
            <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-line-strong px-4 text-sm font-semibold hover:bg-sunken has-focus-visible:ring-3 has-focus-visible:ring-accent/40">
              {busy === "logo" ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <ImagePlus aria-hidden className="size-4" />}
              {value.logo ? "החלפה" : "העלאת לוגו"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,image/*"
                className="sr-only"
                disabled={busy !== null}
                onChange={(e) => {
                  void addLogo(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </label>
            {value.logo && (
              <button type="button" onClick={() => void commit({ ...value, logo: null })} className="flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-danger hover:bg-danger-soft">
                <Trash2 aria-hidden className="size-4" />
                הסרה
              </button>
            )}
          </div>
        </div>
      </div>

      <div>
        <p className="font-bold">
          תמונות מהפעילות <span className="text-[13px] font-semibold text-muted">· {value.photos.length}/{MAX_PHOTOS}</span>
        </p>
        <p className="text-[13px] text-muted">לפחות תמונה אחת. התמונה הראשונה היא התמונה הראשית בכרטיס ובדף העסק. JPG, PNG או WebP, עד 5MB לתמונה.</p>
        <ul id={galleryId} tabIndex={-1} className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {value.photos.map((url, i) => (
            <li key={url} className="flex flex-col gap-1">
              <div className="relative overflow-hidden rounded-xl border border-line bg-sunken">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`תמונה ${i + 1}`} className="aspect-[4/3] w-full object-cover" />
                {i === 0 && <span className="absolute top-2 start-2 rounded-md bg-card px-1.5 py-0.5 text-[12px] font-bold text-ink">ראשית</span>}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex">
                  {i > 0 && (
                    <>
                      <button type="button" onClick={() => move(i, 0)} className="grid size-11 place-items-center rounded-lg text-muted hover:bg-sunken hover:text-accent-ink" aria-label={`הגדרת תמונה ${i + 1} כראשית`} title="הגדרה כראשית">
                        <Star aria-hidden className="size-4" />
                      </button>
                      <button type="button" onClick={() => move(i, i - 1)} className="grid size-11 place-items-center rounded-lg text-muted hover:bg-sunken hover:text-ink" aria-label={`הזזת תמונה ${i + 1} מקום אחד קדימה`} title="הזזה קדימה">
                        <ArrowRight aria-hidden className="size-4" />
                      </button>
                    </>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => void commit({ ...value, photos: value.photos.filter((u) => u !== url) })}
                  className="grid size-11 place-items-center rounded-lg text-muted hover:bg-danger-soft hover:text-danger"
                  aria-label={`מחיקת תמונה ${i + 1}`}
                  title="מחיקה"
                >
                  <Trash2 aria-hidden className="size-4" />
                </button>
              </div>
            </li>
          ))}
          {!full && (
            <li>
              <label
                className={cx(
                  "grid aspect-[4/3] cursor-pointer place-items-center rounded-xl border-[1.5px] border-dashed border-line-strong text-center text-sm font-semibold text-accent-ink hover:bg-sunken has-focus-visible:ring-3 has-focus-visible:ring-accent/40",
                  busy === "gallery" && "pointer-events-none opacity-60",
                )}
              >
                <span className="flex flex-col items-center gap-1">
                  {busy === "gallery" ? <Loader2 aria-hidden className="size-5 animate-spin" /> : <ImagePlus aria-hidden className="size-5" />}
                  {busy === "gallery" ? "מעלים…" : "הוספת תמונות"}
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,image/*"
                  multiple
                  className="sr-only"
                  disabled={busy !== null}
                  onChange={(e) => {
                    void addPhotos(e.target.files);
                    e.target.value = "";
                  }}
                />
              </label>
            </li>
          )}
        </ul>
        {error}
        <p className="mt-3 text-[13px] text-muted">מעלים רק תמונות שיש עליהן הסכמה של ההורים או המוסד לפרסום ילדים מזוהים. תמונות עוברות בדיקה של הצוות.</p>
      </div>
    </div>
  );
}
