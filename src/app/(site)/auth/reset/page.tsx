import type { Metadata } from "next";
import { ResetView } from "./reset-view";

export const metadata: Metadata = { title: "סיסמה חדשה", robots: { index: false } };

export default function ResetPage() {
  return <ResetView />;
}
