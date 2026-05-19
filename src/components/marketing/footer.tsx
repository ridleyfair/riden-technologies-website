import React from "react";
import Link from "next/link";
import { ExternalLink, Link2, Code2, Mail } from "lucide-react";

const footerLinks = {
  Company: [
    { label: "About", href: "/about" },
    { label: "Our Work", href: "/our-work" },
    { label: "Blog", href: "/blog" },
    { label: "Case Studies", href: "/case-studies" },
    { label: "Contact", href: "/contact" },
  ],
  Solutions: [
    { label: "AI Websites", href: "/solutions" },
    { label: "CRM Systems", href: "/solutions" },
    { label: "Automation", href: "/solutions" },
    { label: "Lead Generation", href: "/solutions" },
    { label: "Analytics", href: "/solutions" },
  ],
  Industries: [
    { label: "Healthcare", href: "/industries" },
    { label: "Real Estate", href: "/industries" },
    { label: "E-Commerce", href: "/industries" },
    { label: "Legal", href: "/industries" },
    { label: "Finance", href: "/industries" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Cookie Policy", href: "/cookies" },
  ],
};

export default function Footer() {
  return (
    <footer className="relative border-t border-riden-border">
      <div className="absolute inset-0 bg-gradient-to-b from-riden-dark to-riden-darker" />
      <div className="relative max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center mb-4">
              <div
                style={{
                  width: "240px",
                  height: "60px",
                  backgroundImage: "url(/images/RidenLogo.png)",
                  backgroundSize: "200% auto",
                  backgroundPosition: "left center",
                  backgroundRepeat: "no-repeat",
                }}
                aria-label="Riden Technologies"
              />
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed mb-6">
              AI-powered websites, automation systems, and CRM platforms that transform businesses and drive measurable growth.
            </p>
            <div className="flex items-center gap-3">
              {[
                { icon: ExternalLink, href: "#" },
                { icon: Link2, href: "#" },
                { icon: Code2, href: "#" },
                { icon: Mail, href: "mailto:hello@ridentechnologies.com" },
              ].map(({ icon: Icon, href }, i) => (
                <a
                  key={i}
                  href={href}
                  className="w-9 h-9 rounded-lg bg-riden-muted border border-riden-border flex items-center justify-center text-slate-400 hover:text-white hover:border-blue-500/50 transition-all duration-200"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-sm font-semibold text-white mb-4">{category}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-400 hover:text-white transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-riden-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} Riden Technologies. All rights reserved.
          </p>
          <div className="flex items-center gap-1 text-sm text-slate-500">
            <span>Built with</span>
            <span className="text-blue-400">AI</span>
            <span>for the future of business.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
