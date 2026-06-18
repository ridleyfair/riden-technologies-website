import LegalLayout from "@/components/marketing/legal-layout";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Acceptable Use Policy",
  description: "Rules governing acceptable use of Riden Technologies services and platforms.",
};

export default function AcceptableUsePage() {
  return (
    <LegalLayout
      title="Acceptable Use Policy"
      subtitle="This policy sets out the rules for using our services responsibly. Violations may result in immediate suspension."
      lastUpdated="9 June 2026"
      effectiveDate="9 June 2026"
      sections={[
        {
          title: "Purpose",
          content: (
            <p>
              This Acceptable Use Policy (&ldquo;AUP&rdquo;) applies to all users of Riden Technologies services, including our website, CRM platform, automation tools, and any websites we build and host on your behalf. It forms part of our Terms of Service and must be read alongside them. By using our services, you agree to comply with this AUP.
            </p>
          ),
        },
        {
          title: "Prohibited Activities",
          content: (
            <>
              <p>You must not use our services or any website we build for you to:</p>
              <ul className="list-disc list-outside pl-5 space-y-2 mt-2">
                <li>Violate any applicable law or regulation, including UK law and the laws of the country in which you operate.</li>
                <li>Infringe the intellectual property rights, privacy rights, or any other rights of any person or company.</li>
                <li>Send unsolicited commercial communications (&ldquo;spam&rdquo;) in breach of the UK Privacy and Electronic Communications Regulations (PECR) or any equivalent law.</li>
                <li>Transmit, store, or distribute viruses, malware, ransomware, or any other harmful code.</li>
                <li>Conduct phishing, social engineering, or any fraudulent activity.</li>
                <li>Harass, abuse, threaten, stalk, or defame any person.</li>
                <li>Publish or distribute content that is obscene, pornographic, hateful, discriminatory, or that promotes violence or illegal activity.</li>
                <li>Misrepresent your identity, business, products, or services in any way that could mislead consumers or third parties.</li>
                <li>Engage in any activity that could bring Riden Technologies into disrepute.</li>
                <li>Attempt to gain unauthorised access to our systems, our clients&apos; systems, or any other systems.</li>
                <li>Use our services to operate or facilitate high-risk financial products, pyramid schemes, or illegal lotteries.</li>
                <li>Use the email outreach features of our platform to contact individuals who have not given consent under applicable data protection law.</li>
                <li>Scrape, mine, or otherwise extract data from our platform for any purpose not expressly permitted.</li>
                <li>Resell or sublicense our services without our prior written consent.</li>
              </ul>
            </>
          ),
        },
        {
          title: "Content Standards",
          content: (
            <>
              <p>Any content published on websites we build for you, or stored within our platform, must:</p>
              <ul className="list-disc list-outside pl-5 space-y-2 mt-2">
                <li>Be accurate, truthful, and not misleading to consumers.</li>
                <li>Comply with the UK Consumer Rights Act 2015 and the Consumer Protection from Unfair Trading Regulations 2008.</li>
                <li>Not make unsubstantiated or misleading claims about products, services, or results.</li>
                <li>Include all legally required disclosures for your industry (e.g. Gas Safe registration for heating engineers, SRA regulation for solicitors).</li>
                <li>Comply with ASA/CAP advertising standards where applicable.</li>
              </ul>
              <p className="mt-3">
                We reserve the right to review and refuse to publish or to remove any content that, in our reasonable judgement, violates these standards or exposes us to legal liability.
              </p>
            </>
          ),
        },
        {
          title: "Email and Outreach",
          content: (
            <>
              <p>Where we provide or you use email outreach tools through our platform:</p>
              <ul className="list-disc list-outside pl-5 space-y-2 mt-2">
                <li>You are responsible for ensuring you have a lawful basis to contact each recipient under UK GDPR and PECR.</li>
                <li>All emails sent must include accurate sender identification and a clear, functional unsubscribe mechanism.</li>
                <li>You must honour unsubscribe requests promptly and within the timeframes required by law.</li>
                <li>You must not use purchased email lists sourced from jurisdictions or providers that do not comply with applicable data protection law.</li>
                <li>We reserve the right to suspend email sending capabilities if we detect abuse or unusually high bounce/spam rates that risk our sending reputation.</li>
              </ul>
            </>
          ),
        },
        {
          title: "Data Protection",
          content: (
            <>
              <p>
                Where you process personal data of third parties (e.g. your customers) through our platform, you act as a data controller and are solely responsible for ensuring your use of that data complies with UK GDPR, the Data Protection Act 2018, and all other applicable data protection laws.
              </p>
              <p>
                You must not store sensitive personal data (such as financial account details, health data, or national insurance numbers) within our platform without our prior written agreement and appropriate safeguards in place.
              </p>
            </>
          ),
        },
        {
          title: "Resource Use",
          content: (
            <p>
              You must not use our services in any way that places an unreasonable or disproportionate load on our infrastructure, interferes with the access of other users, or disrupts our platform. This includes (without limitation) automated scraping, denial-of-service attacks, or excessive API calls beyond agreed limits.
            </p>
          ),
        },
        {
          title: "Consequences of Violation",
          content: (
            <>
              <p>If we determine, in our reasonable discretion, that you have violated this AUP, we may:</p>
              <ul className="list-disc list-outside pl-5 space-y-2 mt-2">
                <li>Issue a warning and require immediate remediation.</li>
                <li>Suspend access to some or all of our services with immediate effect.</li>
                <li>Terminate your account and our agreement without refund.</li>
                <li>Report the matter to relevant authorities, including law enforcement.</li>
                <li>Pursue legal action to recover losses, damages, or costs.</li>
              </ul>
              <p className="mt-3">
                You agree to indemnify, defend, and hold harmless Riden Technologies and its directors, employees, and agents from and against any claims, liabilities, damages, fines, and costs (including reasonable legal fees) arising from your violation of this AUP.
              </p>
            </>
          ),
        },
        {
          title: "Reporting Violations",
          content: (
            <p>
              If you become aware of any use of our services that violates this AUP, please report it immediately to <strong className="text-white">enquiries@ridentechnologies.com</strong>. We investigate all credible reports and take appropriate action.
            </p>
          ),
        },
        {
          title: "Changes to This Policy",
          content: (
            <p>
              We may update this AUP at any time. We will notify clients of material changes via email or through the platform. Your continued use of our services after the effective date of changes constitutes acceptance of the updated AUP.
            </p>
          ),
        },
      ]}
    />
  );
}
