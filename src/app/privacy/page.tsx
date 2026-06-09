import LegalLayout from "@/components/marketing/legal-layout";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Riden Technologies collects, uses, and protects your personal data.",
};

export default function PrivacyPage() {
  return (
    <LegalLayout
      title="Privacy Policy"
      subtitle="We take your privacy seriously. This policy explains exactly what data we collect, why we collect it, and how we keep it safe."
      lastUpdated="9 June 2026"
      effectiveDate="9 June 2026"
      sections={[
        {
          title: "Who We Are",
          content: (
            <>
              <p>
                Riden Technologies (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) is a digital agency and software company based in London, UK. We provide website design and build services, CRM platforms, marketing automation tools, and lead generation services to small and medium-sized businesses.
              </p>
              <p>
                For the purposes of UK data protection law (UK GDPR and the Data Protection Act 2018), Riden Technologies is the data controller of personal information collected through this website and our platforms.
              </p>
              <p>
                Contact us at: <strong className="text-white">inquiries@ridentechnologies.com</strong>
              </p>
            </>
          ),
        },
        {
          title: "What Data We Collect",
          content: (
            <>
              <p>We collect the following categories of personal data:</p>
              <ul className="list-disc list-outside pl-5 space-y-2 mt-2">
                <li><strong className="text-white">Identity data:</strong> First name, last name, business name.</li>
                <li><strong className="text-white">Contact data:</strong> Email address, phone number, town/city.</li>
                <li><strong className="text-white">Business data:</strong> Industry, current website, services offered, target customers, social media handles.</li>
                <li><strong className="text-white">Technical data:</strong> IP address, browser type and version, time zone, browser plug-in types, operating system and platform, and other technology on the devices you use to access our website.</li>
                <li><strong className="text-white">Usage data:</strong> Information about how you use our website and services.</li>
                <li><strong className="text-white">Marketing preferences:</strong> Your preferences in receiving marketing communications from us.</li>
                <li><strong className="text-white">Financial data:</strong> Payment method details (processed securely by third-party payment processors — we do not store card numbers).</li>
              </ul>
              <p className="mt-3">We do not collect any special category personal data (such as data about race, religion, health, or sexual orientation).</p>
            </>
          ),
        },
        {
          title: "How We Collect Your Data",
          content: (
            <>
              <p>We collect data through:</p>
              <ul className="list-disc list-outside pl-5 space-y-2 mt-2">
                <li><strong className="text-white">Direct interactions:</strong> When you fill in our contact form, project brief form, or client onboarding form; when you email or call us; when you sign up to our platform.</li>
                <li><strong className="text-white">Automated technologies:</strong> As you interact with our website, we may automatically collect technical data about your equipment and browsing actions using cookies and similar technologies.</li>
                <li><strong className="text-white">Third parties:</strong> We may receive data from analytics providers such as Vercel Analytics, payment processors, and publicly available sources where we legitimately prospect potential clients.</li>
              </ul>
            </>
          ),
        },
        {
          title: "How We Use Your Data",
          content: (
            <>
              <p>We use your personal data for the following purposes:</p>
              <ul className="list-disc list-outside pl-5 space-y-2 mt-2">
                <li>To respond to your enquiry and provide the services you have requested.</li>
                <li>To onboard you as a client and manage our business relationship with you.</li>
                <li>To process payments and manage billing.</li>
                <li>To send service-related communications (e.g. project updates, invoices).</li>
                <li>To send marketing communications where you have consented or where we have a legitimate interest.</li>
                <li>To improve our website and services through analytics.</li>
                <li>To comply with our legal obligations.</li>
                <li>To defend or exercise our legal rights.</li>
              </ul>
              <p className="mt-3">
                Our lawful bases for processing under UK GDPR are: <strong className="text-white">contract</strong> (to perform services you have engaged us for), <strong className="text-white">legitimate interests</strong> (e.g. direct marketing to prospective clients, improving our services), <strong className="text-white">consent</strong> (e.g. cookies and email marketing), and <strong className="text-white">legal obligation</strong> (e.g. accounting and fraud prevention).
              </p>
            </>
          ),
        },
        {
          title: "Data Sharing and Third Parties",
          content: (
            <>
              <p>We do not sell your personal data to anyone. We may share your data with:</p>
              <ul className="list-disc list-outside pl-5 space-y-2 mt-2">
                <li><strong className="text-white">Service providers</strong> who assist us in running our business (e.g. cloud hosting on Vercel/Neon, payment processors, email providers). These parties process data only on our instructions and are bound by data processing agreements.</li>
                <li><strong className="text-white">Professional advisers</strong> including lawyers, accountants, and insurers, under duty of confidentiality.</li>
                <li><strong className="text-white">Regulators and authorities</strong> where required by law.</li>
              </ul>
              <p className="mt-3">
                Where any provider is located outside the UK, we ensure appropriate safeguards are in place (such as UK adequacy decisions or standard contractual clauses).
              </p>
            </>
          ),
        },
        {
          title: "Data Retention",
          content: (
            <>
              <p>We retain personal data only for as long as necessary for the purposes set out in this policy:</p>
              <ul className="list-disc list-outside pl-5 space-y-2 mt-2">
                <li>Client records are retained for 7 years after the end of the contract (for HMRC/legal purposes).</li>
                <li>Enquiry data where no contract is formed is deleted after 12 months.</li>
                <li>Marketing contact data is retained until you unsubscribe or object.</li>
                <li>Website usage/analytics data is retained for up to 26 months.</li>
              </ul>
            </>
          ),
        },
        {
          title: "Your Rights",
          content: (
            <>
              <p>Under UK GDPR, you have the following rights:</p>
              <ul className="list-disc list-outside pl-5 space-y-2 mt-2">
                <li><strong className="text-white">Access:</strong> Request a copy of the personal data we hold about you.</li>
                <li><strong className="text-white">Rectification:</strong> Request correction of inaccurate or incomplete data.</li>
                <li><strong className="text-white">Erasure:</strong> Request deletion of your data in certain circumstances.</li>
                <li><strong className="text-white">Restriction:</strong> Request we restrict processing of your data in certain circumstances.</li>
                <li><strong className="text-white">Portability:</strong> Request transfer of your data to you or a third party in a structured, machine-readable format.</li>
                <li><strong className="text-white">Objection:</strong> Object to processing based on legitimate interests or for direct marketing.</li>
                <li><strong className="text-white">Withdraw consent:</strong> Where we rely on consent, you may withdraw it at any time.</li>
              </ul>
              <p className="mt-3">
                To exercise any of these rights, contact us at <strong className="text-white">inquiries@ridentechnologies.com</strong>. We will respond within 30 days. You also have the right to lodge a complaint with the Information Commissioner&apos;s Office (ICO) at <strong className="text-white">ico.org.uk</strong>.
              </p>
            </>
          ),
        },
        {
          title: "Security",
          content: (
            <p>
              We implement appropriate technical and organisational measures to protect your personal data against unauthorised access, alteration, disclosure, or destruction. These include encrypted data transmission (HTTPS/TLS), access controls, and regular security reviews. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
            </p>
          ),
        },
        {
          title: "Cookies",
          content: (
            <p>
              We use cookies and similar tracking technologies on our website. For full details of the cookies we use and how to manage them, please see our <a href="/cookies" className="text-blue-400 hover:text-blue-300 underline">Cookie Policy</a>.
            </p>
          ),
        },
        {
          title: "Changes to This Policy",
          content: (
            <p>
              We may update this Privacy Policy from time to time. We will notify you of material changes by posting the updated policy on this page with a revised &ldquo;last updated&rdquo; date. We encourage you to review this policy periodically.
            </p>
          ),
        },
        {
          title: "Contact Us",
          content: (
            <>
              <p>For any privacy-related queries or to exercise your rights, contact us:</p>
              <ul className="list-none space-y-1 mt-2">
                <li><strong className="text-white">Email:</strong> inquiries@ridentechnologies.com</li>
                <li><strong className="text-white">Address:</strong> Riden Technologies, London, UK</li>
              </ul>
            </>
          ),
        },
      ]}
    />
  );
}
