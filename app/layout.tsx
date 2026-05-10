import type { Metadata } from "next";
import "./globals.css";



export const metadata: Metadata = {
  title: "Neural Mastery — Decode Reality",
  description:
    "AI-driven cognitive engine that transforms how you perceive, learn, and evolve through neural technology.",
  openGraph: {
    title: "Neural Mastery — Decode Reality",
    description: "Decode Reality Through Neural Mastery",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased dark"
     
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
