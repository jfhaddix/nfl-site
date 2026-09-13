import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://applywise-job-copilot.glad-rhino-6959.chatgpt.site"),
  title: "Sunday Edge — NFL decision intelligence",
  description: "Model, market, expert, and context signals for the NFL Sunday daytime slate.",
  openGraph: {
    title: "Sunday Edge — NFL decision intelligence",
    description: "A quality-gated NFL betting analysis dashboard for Sunday daytime games.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Sunday Edge NFL decision intelligence" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sunday Edge — NFL decision intelligence",
    description: "A quality-gated NFL betting analysis dashboard for Sunday daytime games.",
    images: ["/og.png"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
