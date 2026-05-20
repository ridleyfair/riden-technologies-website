import Navbar from "@/components/marketing/navbar";
import Footer from "@/components/marketing/footer";
import Hero from "@/components/marketing/hero";
import CTASection from "@/components/marketing/cta-section";
import TrustedBrands from "@/components/marketing/trusted-brands";
import ProcessSection from "@/components/marketing/process-section";
import FAQSection from "@/components/marketing/faq-section";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <TrustedBrands />
        <ProcessSection />
        <FAQSection />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
