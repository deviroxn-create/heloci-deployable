import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import "@/lib/notifications/startup";
import { siteConfig } from "@/lib/constants/site";
import { SiteAssistant } from "@/components/ai/site-assistant";
import { ToastProvider } from "@/components/ui/toast";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta"
});

export const metadata: Metadata = {
  title: siteConfig.name,
  description: siteConfig.description,
  metadataBase: new URL(siteConfig.url)
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${plusJakarta.variable} scroll-smooth`}>
      <body className="min-h-screen bg-surface font-sans text-slate-950 antialiased">
        <ToastProvider>
          {children}
          <SiteAssistant />
        </ToastProvider>
      </body>
    </html>
  );
}
