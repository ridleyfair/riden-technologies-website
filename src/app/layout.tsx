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
    default: "Riden Technologies — Websites for Trades & Small Businesses UK",
    template: "%s | Riden Technologies",
  },
  description:
    "Riden Technologies designs, builds and manages professional websites for UK trades and small businesses — plumbers, electricians, builders, carpenters and local services. Hosting, SEO and updates handled for you. Free website preview from £299.",
  keywords: [
    "websites for trades",
    "websites for small businesses UK",
    "website design for trades",
    "websites for plumbers",
    "websites for builders",
    "website design for electricians",
    "websites for carpenters",
    "small business website design UK",
    "local business website design",
    "website design for tradespeople",
    "managed website hosting UK",
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
    title: "Websites Built To Bring Local Businesses More Enquiries",
    description:
      "We design, build and manage professional websites for UK trades and service businesses — with hosting, updates and SEO handled for you. From £299.",
    images: [
      {
        url: "/images/og-image.png",
        width: 1200,
        height: 630,
        alt: "Riden Technologies — Websites for UK trades and small businesses",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Websites for Trades & Small Businesses UK | Riden Technologies",
    description:
      "Professional websites for UK trades and local businesses. Hosting, SEO and updates handled for you. From £299.",
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
