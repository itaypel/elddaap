import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getOperatorPage, getProfile, getSettings } from "@/lib/db";
import { BookView } from "./book-view";

export const metadata: Metadata = { title: "בקשת הזמנה", robots: { index: false } };

export default async function BookPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [op, profile, settings] = await Promise.all([getOperatorPage(slug), getProfile(), getSettings()]);
  if (!op) notFound();
  return (
    <Suspense>
      <BookView op={op} profile={profile} deposit={settings.deposit} />
    </Suspense>
  );
}
