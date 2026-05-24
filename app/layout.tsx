import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Neural Mastery — Decode Reality",
    template: "%s | Neural Mastery",
  },

  description:
    "AI-powered cognitive simulation platform that transforms learning into interactive neural experiences across science, physics, biology, mathematics, and space exploration.",

  keywords: [
    "AI education",
    "simulation learning",
    "neural learning system",
    "physics simulator",
    "biology simulations",
    "knowledge graph",
    "interactive education",
    "Neural Mastery",
  ],

  authors: [{ name: "Neural Mastery Team" }],

  creator: "Neural Mastery",

  metadataBase: new URL("https://neuron-0ne.vercel.app"),

  openGraph: {
    title: "Neural Mastery — Decode Reality",
    description:
      "Explore interactive simulations across science, AI, and human cognition.",
    url: "https://neuron-0ne.vercel.app",
    siteName: "Neural Mastery",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Neural Mastery Preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Neural Mastery — Decode Reality",
    description:
      "AI-powered simulation engine for science and cognitive learning.",
    images: ["/og-image.png"],
    creator: "@neuralmastery",
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },

  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },

};

export const viewport = {
  themeColor: "#0C1324",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <link rel="shortcut icon" href="favicon.ico" type="image/x-icon" />
            <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}