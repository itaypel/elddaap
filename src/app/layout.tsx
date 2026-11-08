import type { Metadata, Viewport } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/brand";
import { SessionLoader } from "@/components/session";

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  variable: "--font-heebo",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "הפעילו — כל ההפעלות לילדים, במקום אחד",
    template: "%s · הפעילו",
  },
  description: "מוצאים מפעיל ליום הולדת, לבית הספר, לקייטנה או ליום משפחות. משווים מחירים, בודקים זמינות ושולחים בקשה בכמה דקות.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#18181d" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="he" dir="rtl" className={heebo.variable}>
      <body className="min-h-dvh">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:start-3 focus:z-[70] focus:rounded-xl focus:bg-contrast focus:px-4 focus:py-3 focus:text-on-contrast">
          דילוג לתוכן
        </a>
        <SessionLoader />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
