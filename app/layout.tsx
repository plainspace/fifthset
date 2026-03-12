import type { Metadata } from "next";
import { Playfair_Display, Inter, JetBrains_Mono } from "next/font/google";
import JsonLd from "@/components/JsonLd";
import { organizationSchema, websiteSchema } from "@/lib/jsonld";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://fifthset.live"),
  title: {
    default: "Fifth Set - Find Live Jazz Tonight",
    template: "%s | Fifth Set",
  },
  description:
    "Find live jazz tonight. Listings, maps, and venue guides for jazz in NYC and beyond.",
  keywords: [
    "jazz",
    "live jazz",
    "jazz tonight",
    "jazz NYC",
    "jazz clubs",
    "live music",
    "jazz venues",
  ],
  authors: [{ name: "Fifth Set" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Fifth Set",
    title: "Fifth Set - Find Live Jazz Tonight",
    description:
      "Find live jazz tonight. Listings, maps, and venue guides for jazz in NYC and beyond.",
    images: [
      {
        url: "/api/og",
        width: 1200,
        height: 630,
        alt: "Fifth Set - Find Live Jazz Tonight",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Fifth Set - Find Live Jazz Tonight",
    description: "Find live jazz tonight.",
    images: ["/api/og"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://fifthset.live",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${inter.variable} ${jetbrains.variable}`}
    >
      <body className="grain min-h-screen antialiased">
        <JsonLd data={[organizationSchema(), websiteSchema()]} />
        {children}
      </body>
    </html>
  );
}
