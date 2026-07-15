import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
  Noto_Sans_Arabic,
  Noto_Sans_Bengali,
  Noto_Sans_Devanagari,
  Noto_Sans_Gujarati,
  Noto_Sans_Gurmukhi,
  Noto_Sans_Kannada,
  Noto_Sans_Malayalam,
  Noto_Sans_Meetei_Mayek,
  Noto_Sans_Ol_Chiki,
  Noto_Sans_Oriya,
  Noto_Sans_Tamil,
  Noto_Sans_Telugu,
} from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoSansDevanagari = Noto_Sans_Devanagari({
  variable: "--font-noto-devanagari",
  subsets: ["devanagari"],
  display: "swap",
});

const notoSansBengali = Noto_Sans_Bengali({
  variable: "--font-noto-bengali",
  subsets: ["bengali"],
  display: "swap",
  preload: false,
});

const notoSansGujarati = Noto_Sans_Gujarati({
  variable: "--font-noto-gujarati",
  subsets: ["gujarati"],
  display: "swap",
  preload: false,
});

const notoSansGurmukhi = Noto_Sans_Gurmukhi({
  variable: "--font-noto-gurmukhi",
  subsets: ["gurmukhi"],
  display: "swap",
  preload: false,
});

const notoSansKannada = Noto_Sans_Kannada({
  variable: "--font-noto-kannada",
  subsets: ["kannada"],
  display: "swap",
  preload: false,
});

const notoSansMalayalam = Noto_Sans_Malayalam({
  variable: "--font-noto-malayalam",
  subsets: ["malayalam"],
  display: "swap",
  preload: false,
});

const notoSansOriya = Noto_Sans_Oriya({
  variable: "--font-noto-oriya",
  subsets: ["oriya"],
  display: "swap",
  preload: false,
});

const notoSansTamil = Noto_Sans_Tamil({
  variable: "--font-noto-tamil",
  subsets: ["tamil"],
  display: "swap",
  preload: false,
});

const notoSansTelugu = Noto_Sans_Telugu({
  variable: "--font-noto-telugu",
  subsets: ["telugu"],
  display: "swap",
  preload: false,
});

const notoSansArabic = Noto_Sans_Arabic({
  variable: "--font-noto-arabic",
  subsets: ["arabic"],
  display: "swap",
  preload: false,
});

const notoSansOlChiki = Noto_Sans_Ol_Chiki({
  variable: "--font-noto-ol-chiki",
  subsets: ["ol-chiki"],
  display: "swap",
  preload: false,
});

const notoSansMeeteiMayek = Noto_Sans_Meetei_Mayek({
  variable: "--font-noto-meetei-mayek",
  subsets: ["meetei-mayek"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "Astriq",
  description: "Astriq helps users generate and manage birth charts.",
};

const fontVariables = [
  geistSans.variable,
  geistMono.variable,
  notoSansDevanagari.variable,
  notoSansBengali.variable,
  notoSansGujarati.variable,
  notoSansGurmukhi.variable,
  notoSansKannada.variable,
  notoSansMalayalam.variable,
  notoSansOriya.variable,
  notoSansTamil.variable,
  notoSansTelugu.variable,
  notoSansArabic.variable,
  notoSansOlChiki.variable,
  notoSansMeeteiMayek.variable,
].join(" ");

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${fontVariables} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
