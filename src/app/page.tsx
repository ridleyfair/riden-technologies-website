import type { Metadata } from "next";
import Navbar from "@/components/marketing/navbar";
import Footer from "@/components/marketing/footer";
import MotionProvider from "@/components/marketing/motion-provider";
import Hero from "@/components/marketing/hero";
import ProcessScrollStory from "@/components/marketing/process-scroll-story";
import WebsiteExamples from "@/components/marketing/website-examples";
import Services from "@/components/marketing/services";
import WhyChooseRiden from "@/components/marketing/why-choose-riden";
import PricingSection from "@/components/marketing/pricing-section";
import Testimonials from "@/components/marketing/testimonials";
import FAQSection from "@/components/marketing/faq-section";
import CTASection from "@/components/marketing/cta-section";

export const metadata: Metadata = {
  title: "Riden Technologies | Websites for Trades & Small Businesses UK",
  description:
    "Professional website design for UK trades and small businesses: plumbers, electricians, builders, carpenters and local services. We design, build, host and manage your website with SEO included. One simple plan: £199 build + £29.99/month. Get a free website preview.",
  keywords: [
    "websites for trades",
    "websites for small businesses UK",
    "website design for trades",
    "websites for plumbers",
    "websites for builders",
    "website design for electricians",
    "small business website design UK",
    "local business website",
  ],
  alternates: { canonical: "https://ridentechnologies.com" },
  openGraph: {
    title: "Websites Built To Bring Local Businesses More Enquiries",
    description:
      "We design, build and manage professional websites for UK trades and service businesses, with hosting, updates and SEO handled for you.",
    url: "https://ridentechnologies.com",
    type: "website",
  },
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
        "UK web design agency building professional websites for trades, local service businesses and small companies. Website design, SEO, hosting and ongoing support managed for you.",
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
      serviceType: "Website design, SEO, hosting and support for small businesses",
      name: "Website Design for Trades & Small Businesses",
      provider: { "@id": "https://ridentechnologies.com/#organization" },
      description:
        "Professional website design, local SEO, fast hosting and ongoing support for UK trades and local service businesses including plumbers, electricians, builders, carpenters, roofers, landscapers and beauty professionals.",
      areaServed: { "@type": "Country", name: "United Kingdom" },
      audience: {
        "@type": "Audience",
        audienceType:
          "Plumbers, electricians, builders, carpenters, roofers, landscapers, beauty therapists, fitness coaches and local service businesses",
      },
      offers: {
        "@type": "Offer",
        priceCurrency: "GBP",
        price: "29.99",
        description:
          "One simple plan: £199 one-time build fee plus £29.99/month covering website design, hosting, SSL, local SEO, unlimited updates and UK support. No long-term contract.",
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: "29.99",
          priceCurrency: "GBP",
          unitText: "MONTH",
        },
      },
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "How much does a website cost?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "We keep it simple with one plan: a £199 one-time build fee plus £29.99/month. That covers your website design, hosting, SSL, local SEO, unlimited updates and UK support. There are no hidden fees and no long-term contracts.",
          },
        },
        {
          "@type": "Question",
          name: "Do you manage updates for me?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. We handle all the updates for you. Need new photos, a price change or a new service added? Just send it over and we'll make the changes, usually the same day. You never have to log in or touch any code.",
          },
        },
        {
          "@type": "Question",
          name: "Can I preview the website first?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Absolutely. We build a live preview of your website around your business so you can see exactly what it will look like before anything goes live. You review it and request any changes until you're happy.",
          },
        },
        {
          "@type": "Question",
          name: "Do you help with SEO?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. Every website is set up to be found on Google for the services you offer in the areas you work. Higher plans include advanced local SEO, service-specific pages and Google Business optimisation.",
          },
        },
        {
          "@type": "Question",
          name: "Can you redesign my old website?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Of course. Got an old or tired website that isn't winning you work? We rebuild it into something modern and easy to use, keeping the bits that work and refreshing the rest, so it brings in more enquiries.",
          },
        },
        {
          "@type": "Question",
          name: "Can I use my own domain?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Of course. If you already have a domain we'll connect it for you, and if you don't have one yet we'll help you choose and set one up. We handle all the technical bits.",
          },
        },
        {
          "@type": "Question",
          name: "How quickly can my website go live?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Most websites are designed, built and launched within days, not months. You'll usually see your preview within a few working days, and once you're happy we publish it live and handle the rest.",
          },
        },
        {
          "@type": "Question",
          name: "Do I need to do anything technical?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Not at all. We take care of the design, hosting, domain, updates and SEO for you. There's nothing to install and nothing to log into. Just tell us what you need and we make it happen.",
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
      <MotionProvider>
        <div className="public-site">
          <Navbar />
          <main>
            <Hero />
            <ProcessScrollStory />
            <WebsiteExamples />
            <Services />
            <WhyChooseRiden />
            <PricingSection />
            <Testimonials />
            <FAQSection />
            <CTASection />
          </main>
          <Footer />
        </div>
      </MotionProvider>
    </>
  );
}
