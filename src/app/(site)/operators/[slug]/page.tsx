import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getActiveSlugs, getOperatorPage } from "@/lib/db";
import { OperatorView } from "./operator-view";

export const revalidate = 60;

export async function generateStaticParams() {
  return (await getActiveSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const op = await getOperatorPage(slug);
  return { title: op ? op.name : "מפעיל לא נמצא", description: op?.tagline };
}

export default async function OperatorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const op = await getOperatorPage(slug);
  if (!op) notFound();
  return (
    <Suspense>
      <OperatorView op={op} />
    </Suspense>
  );
}
