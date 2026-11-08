import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { operatorBySlug, operators } from "@/lib/data";
import { OperatorView } from "./operator-view";

export function generateStaticParams() {
  return operators.map((o) => ({ slug: o.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const op = operatorBySlug(slug);
  return { title: op ? op.name : "מפעיל לא נמצא", description: op?.tagline };
}

export default async function OperatorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!operatorBySlug(slug)) notFound();
  return (
    <Suspense>
      <OperatorView slug={slug} />
    </Suspense>
  );
}
