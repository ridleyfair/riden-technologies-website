import LegalLayout from "@/components/marketing/legal-layout";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "How Riden Technologies uses cookies and similar tracking technologies.",
};

export default function CookiesPage() {
  return (
    <LegalLayout
      title="Cookie Policy"
      subtitle="This policy explains what cookies are, which ones we use, and how you can control them."
      lastUpdated="9 June 2026"
      effectiveDate="9 June 2026"
      sections={[
        {
          title: "What Are Cookies?",
          content: (
            <p>
              Cookies are small text files placed on your device when you visit a website. They are widely used to make websites work efficiently, remember your preferences, and provide information to website owners. Similar technologies include web beacons, pixels, and local storage — we refer to all of these collectively as &ldquo;cookies&rdquo; in this policy.
            </p>
          ),
        },
        {
          title: "Our Legal Basis for Cookies",
          content: (
            <>
              <p>
                Under the UK Privacy and Electronic Communications Regulations (PECR) and UK GDPR, we are required to obtain your consent before placing non-essential cookies on your device. Essential cookies that are strictly necessary for the website to function do not require consent.
              </p>
              <p>
                Where we rely on consent, you may withdraw it at any time by adjusting your browser settings or using the controls described in section 5 below.
              </p>
            </>
          ),
        },
        {
          title: "Types of Cookies We Use",
          content: (
            <>
              <div className="space-y-5">
                <div>
                  <p className="font-semibold text-white mb-2">Strictly Necessary Cookies</p>
                  <p>These are required for our website and platform to function. They cannot be disabled. They include:</p>
                  <ul className="list-disc list-outside pl-5 space-y-1 mt-2">
                    <li>Authentication session cookies (to keep you logged in to the CRM portal).</li>
                    <li>Security cookies (CSRF protection, rate limiting).</li>
                    <li>Load balancing cookies.</li>
                  </ul>
                </div>

                <div>
                  <p className="font-semibold text-white mb-2">Performance &amp; Analytics Cookies</p>
                  <p>These help us understand how visitors interact with our website. All data is aggregated and anonymous. They include:</p>
                  <ul className="list-disc list-outside pl-5 space-y-1 mt-2">
                    <li>Vercel Analytics — tracks page views, device types, and general usage patterns. No personal data is stored.</li>
                  </ul>
                  <p className="mt-2 text-slate-500 text-xs">Basis: Consent</p>
                </div>

                <div>
                  <p className="font-semibold text-white mb-2">Functional Cookies</p>
                  <p>These enable enhanced functionality and personalisation:</p>
                  <ul className="list-disc list-outside pl-5 space-y-1 mt-2">
                    <li>Theme preference (dark/light mode) stored in local storage.</li>
                    <li>Form state persistence to avoid losing data on page refresh.</li>
                  </ul>
                  <p className="mt-2 text-slate-500 text-xs">Basis: Legitimate interests / Consent</p>
                </div>

                <div>
                  <p className="font-semibold text-white mb-2">Marketing &amp; Targeting Cookies</p>
                  <p>
                    We do not currently use third-party advertising or retargeting cookies. If this changes, we will update this policy and obtain your consent before placing such cookies.
                  </p>
                </div>
              </div>
            </>
          ),
        },
        {
          title: "Third-Party Cookies",
          content: (
            <>
              <p>
                Some cookies on our site are set by third-party services embedded in our pages. We do not control the setting of third-party cookies and you should review the privacy policies of those services:
              </p>
              <ul className="list-disc list-outside pl-5 space-y-2 mt-2">
                <li><strong className="text-white">Vercel</strong> — hosting and performance analytics. <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">Privacy Policy</a></li>
              </ul>
            </>
          ),
        },
        {
          title: "How to Control Cookies",
          content: (
            <>
              <p>You can control and manage cookies in several ways:</p>
              <ul className="list-disc list-outside pl-5 space-y-2 mt-2">
                <li>
                  <strong className="text-white">Browser settings:</strong> Most browsers allow you to view, delete, and block cookies. Note that blocking all cookies may affect the functionality of our website. Guidance for major browsers:
                  <ul className="list-none pl-4 mt-1 space-y-1 text-slate-500">
                    <li>Chrome: Settings &gt; Privacy and security &gt; Cookies</li>
                    <li>Firefox: Settings &gt; Privacy &amp; Security</li>
                    <li>Safari: Preferences &gt; Privacy</li>
                    <li>Edge: Settings &gt; Cookies and site permissions</li>
                  </ul>
                </li>
                <li>
                  <strong className="text-white">Opt-out tools:</strong> You can opt out of analytics tracking via your browser&apos;s Do Not Track setting.
                </li>
              </ul>
              <p className="mt-3">
                Withdrawing consent does not affect the lawfulness of any processing carried out before you withdrew consent.
              </p>
            </>
          ),
        },
        {
          title: "Cookie Retention",
          content: (
            <>
              <p>Cookies are retained for varying durations:</p>
              <ul className="list-disc list-outside pl-5 space-y-2 mt-2">
                <li><strong className="text-white">Session cookies</strong> — deleted when you close your browser.</li>
                <li><strong className="text-white">Persistent cookies</strong> — stored for a set period (typically 30 days to 2 years depending on purpose). You can delete these via your browser at any time.</li>
              </ul>
            </>
          ),
        },
        {
          title: "Changes to This Policy",
          content: (
            <p>
              We may update this Cookie Policy as our use of cookies changes or as regulatory requirements evolve. We will notify you of material changes by posting the updated policy on this page.
            </p>
          ),
        },
        {
          title: "Contact Us",
          content: (
            <>
              <p>For any queries about our use of cookies:</p>
              <ul className="list-none space-y-1 mt-2">
                <li><strong className="text-white">Email:</strong> enquiries@ridentechnologies.com</li>
              </ul>
            </>
          ),
        },
      ]}
    />
  );
}
