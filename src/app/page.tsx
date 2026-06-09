import type { Metadata } from "next";
import Navbar from "@/components/marketing/navbar";
import Footer from "@/components/marketing/footer";
import Hero from "@/components/marketing/hero";
import CTASection from "@/components/marketing/cta-section";
import TrustedBrands from "@/components/marketing/trusted-brands";
import ProcessSection from "@/components/marketing/process-section";
import FAQSection from "@/components/marketing/faq-section";
import { AnimatedHero } from "@/components/ui/animated-hero";

export const metadata: Metadata = {
  title: "Riden Technologies — Web Design Agency London | Websites for Small Businesses",
  description:
    "London-based web design agency building professional websites for small businesses, tradespeople, and local companies across the UK. Get online in 2–5 business days from £299. No hidden fees.",
  alternates: { canonical: "https://ridentechnologies.com" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://ridentechnologies.com/#organization",
      name: "Riden Technologies",
      url: "https://ridentechnologies.com",
      logo: {
        "@type": "ImageObject",
        url: "https://ridentechnologies.com/images/blackridenlogo.png",
      },
      contactPoint: {
        "@type": "ContactPoint",
        email: "inquiries@ridentechnologies.com",
        contactType: "customer service",
        areaServed: "GB",
        availableLanguage: "English",
      },
      address: {
        "@type": "PostalAddress",
        addressLocality: "London",
        addressCountry: "GB",
      },
      sameAs: [],
    },
    {
      "@type": "WebSite",
      "@id": "https://ridentechnologies.com/#website",
      url: "https://ridentechnologies.com",
      name: "Riden Technologies",
      publisher: { "@id": "https://ridentechnologies.com/#organization" },
    },
    {
      "@type": "LocalBusiness",
      "@id": "https://ridentechnologies.com/#localbusiness",
      name: "Riden Technologies",
      description:
        "London-based web design agency building professional websites for small businesses, tradespeople, and local companies across the UK.",
      url: "https://ridentechnologies.com",
      telephone: "",
      email: "inquiries@ridentechnologies.com",
      address: {
        "@type": "PostalAddress",
        addressLocality: "London",
        addressRegion: "England",
        addressCountry: "GB",
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: 51.5074,
        longitude: -0.1278,
      },
      areaServed: {
        "@type": "Country",
        name: "United Kingdom",
      },
      priceRange: "££",
      openingHours: "Mo-Fr 09:00-18:00",
      image: "https://ridentechnologies.com/images/blackridenlogo.png",
    },
    {
      "@type": "Service",
      "@id": "https://ridentechnologies.com/#service-website",
      name: "Website Design & Build",
      provider: { "@id": "https://ridentechnologies.com/#organization" },
      description:
        "Professional website design and development for small businesses, tradespeople, and local companies across the UK. Live in 2–5 business days.",
      areaServed: "GB",
      offers: {
        "@type": "Offer",
        price: "299",
        priceCurrency: "GBP",
        description: "Setup fee from £299. Monthly plans from £49/month.",
      },
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "How quickly can you build and launch my website?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Most websites are fully designed, built, and launched within 2–5 business days. For larger projects we'll give you a precise timeline during your discovery call.",
          },
        },
        {
          "@type": "Question",
          name: "How much does a website cost?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Our Pro plan starts at £299 setup + £49/month. Pro+ is £499 setup + £99/month. Enterprise is £999 setup + £199/month. All plans include hosting, SSL, and unlimited updates.",
          },
        },
        {
          "@type": "Question",
          name: "Do you build websites for tradespeople?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes — we specialise in websites for tradespeople and local service businesses including plumbers, electricians, builders, landscapers, and more.",
          },
        },
        {
          "@type": "Question",
          name: "Is there a money-back guarantee?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. We offer a 14-day money-back guarantee on all plans. If you're not satisfied with your website, we'll refund your setup fee in full.",
          },
        },
        {
          "@type": "Question",
          name: "Do I need any technical knowledge?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Not at all. We handle everything from design to launch. You just tell us about your business and we do the rest.",
          },
        },
      ],
    },
  ],
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      <main>
        <Hero />
        <TrustedBrands />
        <ProcessSection />
        <AnimatedHero />
        <FAQSection />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
