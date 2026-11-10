import type { Metadata } from "next";
import { PromosView } from "./promos-view";

export const metadata: Metadata = { title: "מבצעים וקידום" };

export default function PromosPage() {
  return <PromosView />;
}
