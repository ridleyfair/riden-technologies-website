import LegalLayout from "@/components/marketing/legal-layout";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund Policy",
  description: "Riden Technologies refund and money-back guarantee terms.",
};

export default function RefundPolicyPage() {
  return (
    <LegalLayout
      title="Refund Policy"
      subtitle="We stand behind our work. Here's exactly how our 14-day money-back guarantee works and what you're entitled to."
      lastUpdated="9 June 2026"
      effectiveDate="9 June 2026"
      sections={[
        {
          title: "Our Commitment",
          content: (
            <p>
              Riden Technologies offers a 14-day money-back guarantee on setup fees for new clients. We want every client to feel confident investing in our services, and we stand behind the quality of our work. This policy sets out exactly how that guarantee works and what is and is not covered.
            </p>
          ),
        },
        {
          title: "14-Day Money-Back Guarantee — Setup Fees",
          content: (
            <>
              <p>
                If you are not satisfied with the website we deliver, you may request a full refund of your setup fee within 14 days of your website going live, provided that all of the following conditions are met:
              </p>
              <ul className="list-disc list-outside pl-5 space-y-2 mt-2">
                <li>You submit your refund request in writing to <strong className="text-white">enquiries@ridentechnologies.com</strong> within 14 days of the website launch date.</li>
                <li>You provide a clear written explanation of why you are unsatisfied, allowing us the opportunity to resolve the issue first.</li>
                <li>You have not yet used the website to generate commercial transactions, bookings, or leads at scale.</li>
                <li>The dissatisfaction relates to our work and not to factors outside our control (e.g. your business circumstances changing, you deciding you no longer need a website, or feedback from third parties).</li>
                <li>You have cooperated with our reasonable attempts to address your concerns prior to requesting a refund.</li>
              </ul>
              <p className="mt-3">
                If a refund is approved, we will process it to your original payment method within 10 business days. Upon refund, you agree that the website, design, and all deliverables revert to our ownership and you will no longer use them.
              </p>
            </>
          ),
        },
        {
          title: "Monthly Subscription Fees",
          content: (
            <>
              <p>Monthly subscription fees are <strong className="text-white">non-refundable</strong> except in the following circumstances:</p>
              <ul className="list-disc list-outside pl-5 space-y-2 mt-2">
                <li>We have charged you in error (e.g. billing after confirmed cancellation).</li>
                <li>Our platform has experienced significant unplanned downtime exceeding 72 consecutive hours due to our fault, in which case we may offer a pro-rata credit at our discretion.</li>
              </ul>
              <p className="mt-3">
                Subscriptions cancelled mid-cycle will continue to have access until the end of the paid period. No pro-rata refund is given for partial months.
              </p>
            </>
          ),
        },
        {
          title: "What Is Not Refundable",
          content: (
            <>
              <p>The following are not covered by our refund guarantee:</p>
              <ul className="list-disc list-outside pl-5 space-y-2 mt-2">
                <li>Setup fees where more than 14 days have elapsed since website launch.</li>
                <li>Any fees for additional work, revisions, or add-ons beyond the original scope.</li>
                <li>Fees for projects that were cancelled by you after work had commenced, where cancellation is not due to our material breach.</li>
                <li>Monthly subscription fees beyond the exceptions in section 3.</li>
                <li>Any situation where dissatisfaction arises from content or information you supplied being inaccurate or unsuitable.</li>
                <li>Situations where you have received a significant benefit from the service (e.g. generated confirmed business leads or bookings through the website).</li>
                <li>Change-of-mind refunds after the 14-day window has passed.</li>
              </ul>
            </>
          ),
        },
        {
          title: "Cancellation Process",
          content: (
            <>
              <p>To cancel your subscription or request a refund:</p>
              <ol className="list-decimal list-outside pl-5 space-y-2 mt-2">
                <li>Email <strong className="text-white">enquiries@ridentechnologies.com</strong> with the subject line &ldquo;Cancellation Request&rdquo; or &ldquo;Refund Request&rdquo;.</li>
                <li>Include your full name, business name, and the email address associated with your account.</li>
                <li>For refund requests, include the reason for your request.</li>
                <li>We will acknowledge your request within 2 business days and confirm the outcome within 5 business days.</li>
              </ol>
            </>
          ),
        },
        {
          title: "Consumer Rights",
          content: (
            <p>
              Nothing in this Refund Policy limits or excludes your statutory rights under UK consumer protection law, including the Consumer Rights Act 2015 and the Consumer Contracts (Information, Cancellation and Additional Charges) Regulations 2013. If you are a consumer (i.e. purchasing services for personal, not business, use), you may have additional rights to cancel within 14 days of entering the contract under the above regulations. Contact us if you wish to discuss your statutory rights.
            </p>
          ),
        },
        {
          title: "Disputes",
          content: (
            <p>
              If you are unhappy with our handling of a refund request, please escalate your complaint in writing to <strong className="text-white">enquiries@ridentechnologies.com</strong>. We will endeavour to resolve all complaints fairly and within 14 days. If we are unable to reach an agreement, you may seek independent resolution through the courts of England and Wales.
            </p>
          ),
        },
        {
          title: "Contact",
          content: (
            <>
              <p>For refund and cancellation requests:</p>
              <ul className="list-none space-y-1 mt-2">
                <li><strong className="text-white">Email:</strong> enquiries@ridentechnologies.com</li>
                <li><strong className="text-white">Response time:</strong> Within 2 business days</li>
              </ul>
            </>
          ),
        },
      ]}
    />
  );
}
