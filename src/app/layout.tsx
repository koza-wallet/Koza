import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { FinanceProvider } from "@/lib/finance-context";
import { SupabaseProvider } from "@/lib/supabase-auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "KoZa",
  description: "Mencatat Rapi, Kocek Terjaga",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "KoZa",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#10b981",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        {/* Fonts loaded exactly as in the Stitch screen export */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="bg-surface text-on-surface flex flex-col min-h-screen"
        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      >
        <SupabaseProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <FinanceProvider>{children}</FinanceProvider>
          </ThemeProvider>
        </SupabaseProvider>
      </body>
    </html>
  );
}
