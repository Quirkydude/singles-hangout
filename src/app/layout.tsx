import type { Metadata, Viewport } from "next";
import { Inter, Anton } from "next/font/google";
import "./globals.css";
import { EVENT, getSiteUrl } from "@/lib/event";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const anton = Anton({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const siteUrl = getSiteUrl();

const description = `${EVENT.name} - theme "${EVENT.theme}". ${EVENT.dateLabel} at ${EVENT.timeLabel}, ${EVENT.venue}. Free registration for singles aged ${EVENT.minAge} and above. Real stories, panel talks, games and more.`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${EVENT.name} | Free Registration`,
    template: `%s | ${EVENT.name}`,
  },
  description,
  applicationName: EVENT.name,
  keywords: [
    "Single's Hangout 2026",
    "Single's Hangout",
    "Before the Ring",
    "Church of Pentecost",
    "Habitat Assembly",
    "Foso Town District",
    "Youth Ministry",
    "singles event Ghana",
    "Foso event",
  ],
  authors: [{ name: `${EVENT.host} - ${EVENT.assembly}` }],
  alternates: { canonical: "/" },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: EVENT.name,
    title: `${EVENT.name} - ${EVENT.theme}`,
    description,
    locale: "en_GH",
    images: [
      {
        url: "/api/og",
        width: 1200,
        height: 630,
        alt: `${EVENT.name} flyer`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${EVENT.name} - ${EVENT.theme}`,
    description,
    images: ["/api/og"],
  },
  other: {
    // Helps WhatsApp/Facebook pick up a crisp preview image.
    "og:image:width": "1200",
    "og:image:height": "630",
  },
};

export const viewport: Viewport = {
  themeColor: "#d6081f",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${anton.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-white">{children}</body>
    </html>
  );
}
