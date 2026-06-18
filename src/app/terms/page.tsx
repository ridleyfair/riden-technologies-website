import LegalLayout from "@/components/marketing/legal-layout";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms and conditions governing your use of Riden Technologies services.",
};

export default function TermsPage() {
  return (
    <LegalLayout
      title="Terms of Service"
      subtitle="Please read these terms carefully before using our services. By engaging Riden Technologies, you agree to be bound by these terms."
      lastUpdated="9 June 2026"
      effectiveDate="9 June 2026"
      sections={[
        {
          title: "Agreement and Parties",
          content: (
            <>
              <p>
                These Terms of Service (&ldquo;Terms&rdquo;) govern the relationship between Riden Technologies (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;), a digital agency based in London, UK, and you (&ldquo;Client&rdquo;, &ldquo;you&rdquo;, &ldquo;your&rdquo;), the person or entity engaging our services.
              </p>
              <p>
                By submitting a project brief, signing a proposal, making a payment, or accessing our CRM platform, you confirm that you have read, understood, and agree to these Terms. If you are acting on behalf of a company or other legal entity, you confirm that you have authority to bind that entity.
              </p>
            </>
          ),
        },
        {
          title: "Our Services",
          content: (
            <>
              <p>Riden Technologies provides the following services:</p>
              <ul className="list-disc list-outside pl-5 space-y-2 mt-2">
                <li><strong className="text-white">Website Design & Build:</strong> Custom website design, development, and deployment on a bespoke basis.</li>
                <li><strong className="text-white">CRM Platform:</strong> Access to our proprietary customer relationship management software on a subscription basis (Pro+ and Enterprise plans).</li>
                <li><strong className="text-white">Marketing Automation:</strong> Automated email outreach, lead tracking, and follow-up workflows.</li>
                <li><strong className="text-white">Lead Generation:</strong> Identification and delivery of prospective customer leads for your business.</li>
                <li><strong className="text-white">Ongoing Maintenance & Hosting:</strong> Monthly website hosting, security updates, and technical support.</li>
              </ul>
              <p className="mt-3">
                The exact scope of services will be confirmed in a written proposal or project brief accepted by both parties. Nothing in these Terms obliges us to accept any particular engagement.
              </p>
            </>
          ),
        },
        {
          title: "Fees and Payment",
          content: (
            <>
              <p>Our current pricing is as follows:</p>
              <ul className="list-disc list-outside pl-5 space-y-2 mt-2">
                <li><strong className="text-white">Pro:</strong> £299 setup fee + £49/month</li>
                <li><strong className="text-white">Pro+:</strong> £499 setup fee + £99/month</li>
                <li><strong className="text-white">Enterprise:</strong> £999 setup fee + £199/month</li>
              </ul>
              <p className="mt-3">Pricing may be varied by written agreement. The following payment terms apply:</p>
              <ul className="list-disc list-outside pl-5 space-y-2 mt-2">
                <li>Setup fees are due in full upon acceptance of a proposal before work commences.</li>
                <li>Monthly subscription fees are billed in advance on the same date each month.</li>
                <li>All fees are exclusive of VAT where applicable.</li>
                <li>Invoices are due within 14 days of issue.</li>
                <li>Late payments accrue interest at 8% per annum above the Bank of England base rate under the Late Payment of Commercial Debts (Interest) Act 1998.</li>
                <li>We reserve the right to suspend services if payment is more than 14 days overdue.</li>
              </ul>
            </>
          ),
        },
        {
          title: "Project Delivery",
          content: (
            <>
              <p>
                We aim to deliver completed websites within 2–5 business days of receiving all necessary content, assets, and written approval from you. Delivery timelines are estimates, not guarantees, and may be affected by:
              </p>
              <ul className="list-disc list-outside pl-5 space-y-2 mt-2">
                <li>Delays in receiving content, feedback, or approvals from you.</li>
                <li>Requests for significant scope changes after the project has commenced.</li>
                <li>Circumstances outside our reasonable control.</li>
              </ul>
              <p className="mt-3">
                You are responsible for providing accurate, complete, and timely content, images, and information. We are not responsible for delays caused by your failure to do so.
              </p>
              <p>
                Any revisions beyond two rounds of amends on a project may be subject to additional charges at our standard hourly rate, which will be communicated in advance.
              </p>
            </>
          ),
        },
        {
          title: "Your Responsibilities",
          content: (
            <>
              <p>You agree to:</p>
              <ul className="list-disc list-outside pl-5 space-y-2 mt-2">
                <li>Provide accurate and truthful information about your business and its products or services.</li>
                <li>Ensure that any content, images, logos, or materials you supply to us do not infringe any third-party intellectual property rights and that you have full authority to use them.</li>
                <li>Comply with our Acceptable Use Policy at all times.</li>
                <li>Not use our services for any unlawful, fraudulent, or harmful purpose.</li>
                <li>Maintain the security of any account credentials we provide to you.</li>
                <li>Inform us promptly of any changes to your contact or billing details.</li>
              </ul>
            </>
          ),
        },
        {
          title: "Intellectual Property",
          content: (
            <>
              <p>
                <strong className="text-white">Our IP:</strong> All intellectual property rights in our platform, proprietary tools, frameworks, code, methodologies, and know-how remain our exclusive property at all times. These Terms do not transfer any such rights to you.
              </p>
              <p>
                <strong className="text-white">Your website:</strong> Upon full payment of all outstanding fees, we assign to you the design and content of your website specifically created for you. This does not include our underlying frameworks, components, or third-party libraries, which remain subject to their respective licences.
              </p>
              <p>
                <strong className="text-white">Your content:</strong> You retain ownership of all content, images, logos, and materials you supply to us. You grant us a non-exclusive licence to use such materials solely for the purpose of providing the services.
              </p>
              <p>
                <strong className="text-white">Portfolio:</strong> We reserve the right to display your website in our portfolio and marketing materials unless you notify us in writing that you object.
              </p>
            </>
          ),
        },
        {
          title: "Confidentiality",
          content: (
            <p>
              Each party agrees to keep confidential all non-public information received from the other party in connection with the services (&ldquo;Confidential Information&rdquo;) and not to disclose it to any third party without prior written consent, except as required by law or as necessary to perform the services. This obligation survives termination of these Terms for a period of three years.
            </p>
          ),
        },
        {
          title: "Limitation of Liability",
          content: (
            <>
              <p>
                To the maximum extent permitted by applicable law, our total liability to you in connection with these Terms and our services (whether in contract, tort, breach of statutory duty, or otherwise) shall not exceed the total fees paid by you to us in the 12 months preceding the claim.
              </p>
              <p>We shall not be liable to you for:</p>
              <ul className="list-disc list-outside pl-5 space-y-2 mt-2">
                <li>Loss of profits, revenue, or anticipated savings.</li>
                <li>Loss of business, contracts, or goodwill.</li>
                <li>Loss or corruption of data.</li>
                <li>Indirect, incidental, consequential, or punitive damages of any kind.</li>
                <li>Any claims arising from inaccurate or misleading content you have provided to us.</li>
                <li>Third-party actions, including but not limited to domain registrars, hosting providers, or payment processors.</li>
              </ul>
              <p className="mt-3">
                Nothing in these Terms excludes or limits liability for death or personal injury caused by negligence, fraud or fraudulent misrepresentation, or any other matter which cannot be excluded by law.
              </p>
            </>
          ),
        },
        {
          title: "Warranties and Disclaimers",
          content: (
            <>
              <p>We warrant that we will provide the services with reasonable care and skill.</p>
              <p>We do not warrant that:</p>
              <ul className="list-disc list-outside pl-5 space-y-2 mt-2">
                <li>Our services will generate any particular number of leads, enquiries, or sales.</li>
                <li>Your website will achieve any particular search engine ranking.</li>
                <li>Our services will be uninterrupted or error-free at all times.</li>
              </ul>
              <p className="mt-3">
                Results from digital marketing and lead generation vary and depend on many factors outside our control, including your industry, location, competition, and how you handle enquiries. Any figures or case studies referenced on our website are illustrative and not guarantees.
              </p>
            </>
          ),
        },
        {
          title: "Termination",
          content: (
            <>
              <p><strong className="text-white">Monthly subscriptions</strong> may be cancelled by either party with 30 days&apos; written notice. Cancellation takes effect at the end of the then-current billing period. No refunds are given for partial months except where our Refund Policy applies.</p>
              <p><strong className="text-white">We may terminate immediately</strong> if you: breach these Terms and fail to remedy within 7 days of written notice; become insolvent; use our services in a way that causes legal liability or reputational harm to us; or fail to pay any sums due.</p>
              <p><strong className="text-white">Upon termination:</strong> You will lose access to our CRM platform and hosted services. We will provide you with an export of your data within 14 days of written request. We are not required to retain your data after 30 days post-termination.</p>
            </>
          ),
        },
        {
          title: "Force Majeure",
          content: (
            <p>
              We shall not be in breach of these Terms or liable for any failure or delay in performance if such failure or delay results from circumstances outside our reasonable control, including (without limitation) acts of God, pandemic, war, terrorism, government action, cyberattacks, or failure of third-party infrastructure. We will notify you as soon as reasonably practicable and endeavour to resume performance as soon as possible.
            </p>
          ),
        },
        {
          title: "Governing Law and Disputes",
          content: (
            <>
              <p>
                These Terms are governed by the laws of England and Wales. Any dispute arising from these Terms or our services shall be subject to the exclusive jurisdiction of the courts of England and Wales.
              </p>
              <p>
                Before commencing legal proceedings, both parties agree to attempt to resolve disputes in good faith through negotiation for a period of 30 days following written notice of the dispute.
              </p>
            </>
          ),
        },
        {
          title: "Changes to These Terms",
          content: (
            <p>
              We reserve the right to update these Terms at any time. We will notify existing clients of material changes by email with at least 30 days&apos; notice. Your continued use of our services after changes take effect constitutes acceptance of the updated Terms.
            </p>
          ),
        },
        {
          title: "Contact",
          content: (
            <>
              <p>For any queries regarding these Terms, contact us:</p>
              <ul className="list-none space-y-1 mt-2">
                <li><strong className="text-white">Email:</strong> enquiries@ridentechnologies.com</li>
                <li><strong className="text-white">Address:</strong> Riden Technologies, London, UK</li>
              </ul>
            </>
          ),
        },
      ]}
    />
  );
}
