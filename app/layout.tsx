import type { Metadata } from "next";
import Script from "next/script";
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
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-SKHE825XNH"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){window.dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-SKHE825XNH');
          `}
        </Script>
        <ToastProvider>
          {children}
          <SiteAssistant />
        </ToastProvider>
      </body>
    </html>
  );
}
