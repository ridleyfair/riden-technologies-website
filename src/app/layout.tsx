import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme-context";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://ridentechnologies.com"),
  title: {
    default: "Riden Technologies — Web Design Agency London | Websites for Small Businesses",
    template: "%s | Riden Technologies",
  },
  description:
    "Riden Technologies is a London-based web design agency building professional websites for small businesses, tradespeople, and local companies across the UK. Get online in 2–5 business days.",
  keywords: [
    "web design agency London",
    "website design small business UK",
    "website designer London",
    "affordable website design UK",
    "professional website for small business",
    "website design for tradespeople",
    "web design agency UK",
    "small business website builder UK",
    "get a website for my business",
    "local business website design",
    "Riden Technologies",
  ],
  authors: [{ name: "Riden Technologies", url: "https://ridentechnologies.com" }],
  creator: "Riden Technologies",
  publisher: "Riden Technologies",
  formatDetection: { email: false, address: false, telephone: false },
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: "https://ridentechnologies.com",
    siteName: "Riden Technologies",
    title: "Riden Technologies — Web Design Agency London",
    description:
      "Professional websites for small businesses, tradespeople, and local companies across the UK. Live in 2–5 business days. From £299.",
    images: [
      {
        url: "/images/og-image.png",
        width: 1200,
        height: 630,
        alt: "Riden Technologies — Web Design Agency London",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Riden Technologies — Web Design Agency London",
    description:
      "Professional websites for small businesses across the UK. Live in 2–5 business days. From £299.",
    images: ["/images/og-image.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png" },
    ],
    apple: { url: "/apple-icon.png", type: "image/png" },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Prevent flash of wrong theme — runs synchronously before paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('riden-theme')||(window.matchMedia('(prefers-color-scheme:light)').matches?'light':'dark');document.documentElement.classList.add(t);}catch(e){document.documentElement.classList.add('dark');}})();`,
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
