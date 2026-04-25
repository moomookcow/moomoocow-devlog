import type { Metadata } from "next";
import { Geist_Mono, Noto_Sans_KR, Song_Myung } from "next/font/google";
import "./globals.css";
import BrandGateLink from "@/components/brand-gate-link";
import ThemeToggle from "@/components/theme-toggle";

const notoSansKr = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

const songMyung = Song_Myung({
  variable: "--font-song-myung",
  weight: "400",
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "moomoocow-devlog",
  description: "기술개발 블로그",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${notoSansKr.variable} ${songMyung.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col">
        <header className="border-b">
          <div className="mx-auto flex h-20 w-full max-w-[1480px] items-center justify-between px-4 sm:px-6 lg:px-8">
            <BrandGateLink />
            <div className="flex items-center gap-2">
              <ThemeToggle />
            </div>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="border-t">
          <div className="mx-auto flex h-20 w-full max-w-[1480px] items-center px-4 text-sm text-muted-foreground sm:px-6 lg:px-8">
            moomoocow-devlog · Build in public · Hermes-inspired layout
          </div>
        </footer>
      </body>
    </html>
  );
}
