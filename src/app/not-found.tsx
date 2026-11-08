import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main" className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-4 text-center">
      <span className="grid size-14 place-items-center rounded-2xl bg-accent text-2xl font-extrabold text-white" aria-hidden>
        ה
      </span>
      <h1 className="mt-5 text-[28px] font-extrabold tracking-tight">העמוד לא נמצא</h1>
      <p className="mt-2 text-[17px] text-muted">ייתכן שהקישור ישן או שהמפעיל כבר לא פעיל. אפשר לחפש מחדש.</p>
      <div className="mt-6 flex gap-2">
        <Link href="/" className="inline-flex min-h-11 items-center rounded-xl border border-line-strong bg-card px-5 font-semibold">
          לדף הבית
        </Link>
        <Link href="/search" className="inline-flex min-h-11 items-center rounded-xl bg-accent px-5 font-semibold text-white">
          חיפוש הפעלות
        </Link>
      </div>
    </main>
  );
}
