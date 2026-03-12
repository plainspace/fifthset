import type { Metadata } from "next";
import { Playfair_Display, Inter, JetBrains_Mono } from "next/font/google";
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
    "Discover live jazz shows tonight in NYC, Chicago, New Orleans, LA, and San Francisco. Filter by neighborhood, time, and view on a map.",
  openGraph: {
    type: "website",
    siteName: "Fifth Set",
    title: "Fifth Set - Find Live Jazz Tonight",
    description:
      "Discover live jazz shows tonight in NYC, Chicago, New Orleans, LA, and San Francisco.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Fifth Set - Find Live Jazz Tonight",
    description: "Discover live jazz shows tonight.",
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
        {children}
      </body>
    </html>
  );
}
