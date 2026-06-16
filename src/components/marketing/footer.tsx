import React from "react";
import Link from "next/link";
import { Mail, ArrowUpRight } from "lucide-react";

const footerLinks = {
  Services: [
    { label: "Website Design", href: "/#services" },
    { label: "Website Maintenance", href: "/#services" },
    { label: "Hosting & Domains", href: "/#services" },
    { label: "Local SEO", href: "/#services" },
    { label: "Website Redesigns", href: "/#services" },
  ],
  Company: [
    { label: "Examples", href: "/#examples" },
    { label: "Pricing", href: "/#pricing" },
    { label: "FAQ", href: "/#faq" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Cookie Policy", href: "/cookies" },
    { label: "Acceptable Use", href: "/acceptable-use" },
    { label: "Refund Policy", href: "/refund-policy" },
  ],
};

export default function Footer() {
  return (
    <footer className="relative bg-slate-50 border-t border-slate-200">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-10">
          {/* Brand */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center mb-4">
              <div
                style={{
                  width: "min(230px, 55vw)",
                  height: "56px",
                  backgroundImage: "url(/images/blackridenlogo.png)",
                  backgroundSize: "contain",
                  backgroundPosition: "left center",
                  backgroundRepeat: "no-repeat",
                }}
                aria-label="Riden Technologies"
              />
            </Link>
            <p className="text-sm text-slate-600 leading-relaxed mb-6 max-w-xs">
              We design, build, host and maintain professional websites for UK trades, beauty
              and local service businesses, helping you win more enquiries.
            </p>
            <a
              href="mailto:inquiries@ridentechnologies.com"
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-blue-600 transition-colors"
            >
              <Mail size={16} className="text-blue-600" />
              inquiries@ridentechnologies.com
            </a>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-sm font-semibold text-slate-900 mb-4">{category}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-600 hover:text-blue-600 transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* CTA strip */}
        <div className="mb-10 rounded-2xl bg-white ring-1 ring-slate-200 shadow-[0_8px_24px_-16px_rgba(15,23,42,0.12)] px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm sm:text-base font-medium text-slate-900 text-center sm:text-left">
            Ready to see what your business website could look like?
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-600/30 whitespace-nowrap"
          >
            Get My Website Preview
            <ArrowUpRight size={15} />
          </Link>
        </div>

        {/* Bottom */}
        <div className="pt-6 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} Riden Technologies. All rights reserved.
          </p>
          <p className="text-sm text-slate-500">UK-based web design &amp; website maintenance.</p>
        </div>
      </div>
    </footer>
  );
}
