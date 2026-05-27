import type { Metadata } from "next";
import { Geist_Mono, Noto_Sans_KR, Song_Myung } from "next/font/google";
import "./globals.css";
import BrandGateLink from "@/components/brand-gate-link";
import ThemeToggle from "@/components/theme-toggle";
import { getSiteUrl, toAbsoluteUrl } from "@/lib/site";

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
  metadataBase: new URL(getSiteUrl()),
  verification: {
    google: "5abDZSxqXKuKNEX3DpMsY0FLJDAxPBL-tJ2zGbm_Orw",
  },
  title: {
    default: "Moomoocow Devlog",
    template: "%s | Moomoocow Devlog",
  },
  description: "실전 개발 과정과 트러블슈팅을 기록하는 개인 개발 로그",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "/",
    siteName: "Moomoocow Devlog",
    title: "Moomoocow Devlog",
    description: "실전 개발 과정과 트러블슈팅을 기록하는 개인 개발 로그",
    images: [
      {
        url: toAbsoluteUrl("/default-thumbnail.svg"),
        width: 1200,
        height: 630,
        alt: "Moomoocow Devlog",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Moomoocow Devlog",
    description: "실전 개발 과정과 트러블슈팅을 기록하는 개인 개발 로그",
    images: [toAbsoluteUrl("/default-thumbnail.svg")],
  },
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
          <div className="mx-auto flex h-20 w-full max-w-[1680px] items-center justify-between px-4 sm:px-6 lg:px-8">
            <BrandGateLink />
            <div className="flex items-center gap-2">
              <ThemeToggle />
            </div>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="border-t">
          <div className="mx-auto flex h-20 w-full max-w-[1680px] items-center px-4 text-sm text-muted-foreground sm:px-6 lg:px-8">
            Moomoocow Devlog · Build in public · Hermes-inspired layout
          </div>
        </footer>
      </body>
    </html>
  );
}
