import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { operatorBySlug, operators } from "@/lib/data";
import { BookView } from "./book-view";

export const metadata: Metadata = { title: "בקשת הזמנה" };

export function generateStaticParams() {
  return operators.map((o) => ({ slug: o.slug }));
}

export default async function BookPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!operatorBySlug(slug)) notFound();
  return (
    <Suspense>
      <BookView slug={slug} />
    </Suspense>
  );
}
