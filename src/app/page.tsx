"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Smartphone, Search, Zap, Edit3, Server, HeadphonesIcon,
  Star, ChevronDown, ChevronUp, Check, ArrowRight, Menu, X,
  MapPin, Clock, Shield, TrendingUp,
} from "lucide-react";

// ── Nav ───────────────────────────────────────────────────────────────────────

function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        scrolled ? "bg-white shadow-sm border-b border-gray-100" : "bg-white/95"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
            <Zap size={16} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-xl text-gray-900 tracking-tight">Riden</span>
          <span className="font-bold text-xl text-blue-600 tracking-tight">Technologies</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {[
            { label: "Features", href: "#features" },
            { label: "How it works", href: "#how-it-works" },
            { label: "Examples", href: "#examples" },
            { label: "Pricing", href: "#pricing" },
            { label: "FAQ", href: "#faq" },
          ].map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            Login
          </Link>
          <a
            href="#pricing"
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            Get started
          </a>
        </div>

        <button
          className="md:hidden p-2 text-gray-600"
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-white border-b border-gray-100 px-4 pb-4 space-y-1">
          {[
            { label: "Features", href: "#features" },
            { label: "How it works", href: "#how-it-works" },
            { label: "Examples", href: "#examples" },
            { label: "Pricing", href: "#pricing" },
            { label: "FAQ", href: "#faq" },
          ].map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block py-2.5 text-sm font-medium text-gray-700 hover:text-blue-600"
            >
              {l.label}
            </a>
          ))}
          <div className="pt-2 flex flex-col gap-2">
            <Link href="/login" className="text-center py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg">Login</Link>
            <a href="#pricing" className="text-center py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-lg">Get started</a>
          </div>
        </div>
      )}
    </header>
  );
}

// ── Hero ──────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="pt-28 pb-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">

          {/* Left */}
          <div className="flex-1 text-center lg:text-left">
            {/* Trust badge */}
            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-full px-3.5 py-1.5 mb-6">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={11} className="text-amber-400 fill-amber-400" />
                ))}
              </div>
              <span className="text-xs font-semibold text-blue-700">Trusted by 500+ UK businesses</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-5xl font-extrabold text-gray-900 leading-tight tracking-tight mb-5">
              Professional websites for UK{" "}
              <span className="text-blue-600">tradespeople</span> &{" "}
              <span className="text-blue-600">small businesses</span>
            </h1>

            <p className="text-lg text-gray-500 leading-relaxed mb-8 max-w-xl mx-auto lg:mx-0">
              Get a stunning, mobile-friendly website built in 2&ndash;5 business days.
              No big agency fees. Hosting, SEO, and ongoing support all included.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mb-8">
              <a
                href="#pricing"
                className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base px-6 py-3.5 rounded-xl transition-colors shadow-md shadow-blue-200"
              >
                Get your website <ArrowRight size={16} />
              </a>
              <a
                href="#examples"
                className="inline-flex items-center justify-center gap-2 border-2 border-gray-200 hover:border-gray-300 text-gray-700 font-semibold text-base px-6 py-3.5 rounded-xl transition-colors"
              >
                See examples
              </a>
            </div>

            {/* Social proof */}
            <div className="flex flex-col sm:flex-row items-center lg:items-start gap-4 sm:gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={13} className="text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <span className="font-semibold text-gray-700">4.9/5</span>
                <span>from 600+ reviews</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Shield size={14} className="text-green-500" />
                <span>14-day money-back guarantee</span>
              </div>
            </div>
          </div>

          {/* Right — browser mockup */}
          <div className="flex-1 w-full max-w-lg">
            <div className="relative">
              {/* Browser chrome */}
              <div className="bg-gray-800 rounded-t-2xl px-4 py-3 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <div className="flex-1 mx-3 bg-gray-700 rounded-md px-3 py-1.5">
                  <span className="text-xs text-gray-400">yourwebsite.co.uk</span>
                </div>
              </div>
              {/* Site preview */}
              <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 rounded-b-2xl overflow-hidden shadow-2xl">
                {/* Fake hero */}
                <div className="px-6 py-8">
                  <div className="h-3 w-24 bg-blue-400/40 rounded-full mb-3" />
                  <div className="h-6 w-56 bg-white/20 rounded-lg mb-2" />
                  <div className="h-6 w-40 bg-white/15 rounded-lg mb-5" />
                  <div className="h-4 w-64 bg-white/10 rounded-md mb-1.5" />
                  <div className="h-4 w-52 bg-white/10 rounded-md mb-6" />
                  <div className="flex gap-2">
                    <div className="h-9 w-28 bg-blue-500 rounded-lg" />
                    <div className="h-9 w-24 bg-white/10 rounded-lg border border-white/20" />
                  </div>
                </div>
                {/* Fake trust bar */}
                <div className="bg-blue-900/40 px-6 py-3 flex gap-6">
                  {["★ 4.9/5", "200+ Reviews", "10 yrs exp"].map((t) => (
                    <div key={t} className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                      <span className="text-xs text-blue-200 font-medium">{t}</span>
                    </div>
                  ))}
                </div>
                {/* Fake services */}
                <div className="px-6 py-5 grid grid-cols-2 gap-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white/5 rounded-lg p-3">
                      <div className="h-2.5 w-16 bg-white/20 rounded mb-1.5" />
                      <div className="h-2 w-24 bg-white/10 rounded" />
                    </div>
                  ))}
                </div>
              </div>
              {/* Floating badge */}
              <div className="absolute -bottom-4 -right-4 bg-white border border-gray-100 rounded-xl shadow-lg px-3 py-2.5 flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center">
                  <Check size={14} className="text-green-600" strokeWidth={3} />
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-900">Live in 2-5 days</div>
                  <div className="text-[10px] text-gray-400">Ready to take enquiries</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Stats strip ───────────────────────────────────────────────────────────────

function StatsStrip() {
  const stats = [
    { value: "500+",  label: "Websites built",          icon: TrendingUp },
    { value: "£2.4M+", label: "Saved vs big agencies",  icon: Shield     },
    { value: "2–5",   label: "Days to go live",          icon: Clock      },
    { value: "600+",  label: "5-star reviews",           icon: Star       },
  ];

  return (
    <section className="bg-blue-600 py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-0 lg:divide-x lg:divide-blue-500">
          {stats.map(({ value, label, icon: Icon }) => (
            <div key={label} className="flex flex-col items-center text-center lg:px-8">
              <Icon size={18} className="text-blue-200 mb-2" />
              <div className="text-3xl font-extrabold text-white mb-1">{value}</div>
              <div className="text-sm text-blue-200 font-medium">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Features ──────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: Smartphone,
    title: "Mobile-first design",
    desc: "Over 60% of your customers browse on mobile. Every site we build looks perfect on any screen.",
  },
  {
    icon: Search,
    title: "SEO optimised",
    desc: "Built-in local SEO so you show up when customers in your area search for your services.",
  },
  {
    icon: Zap,
    title: "Live in 2–5 business days",
    desc: "No waiting months for an agency. We move fast — you'll be online and taking enquiries in days.",
  },
  {
    icon: Edit3,
    title: "Easy to update",
    desc: "Need to change a price, add a photo, or update your hours? Just message us — same-day updates.",
  },
  {
    icon: Server,
    title: "Hosting & SSL included",
    desc: "We handle the technical stuff. Fast hosting, secure HTTPS, and a custom domain all included.",
  },
  {
    icon: HeadphonesIcon,
    title: "Ongoing support",
    desc: "We don't disappear after launch. Get real support from a real team whenever you need it.",
  },
];

function Features() {
  return (
    <section id="features" className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-600 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4">
            Everything included
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
            Everything your business needs online
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            No extras to bolt on. No surprises. One package covers everything you need to look professional and get found online.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="group bg-white border border-gray-200 hover:border-blue-200 rounded-2xl p-6 transition-all duration-200 hover:shadow-lg hover:shadow-blue-50"
            >
              <div className="w-11 h-11 rounded-xl bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center mb-4 transition-colors">
                <Icon size={20} className="text-blue-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Mobile section ────────────────────────────────────────────────────────────

function MobileSection() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          {/* Phone mockup */}
          <div className="flex-shrink-0">
            <div className="relative mx-auto w-56">
              <div className="bg-gray-900 rounded-[2.5rem] p-3 shadow-2xl">
                <div className="bg-gray-800 rounded-[2rem] overflow-hidden">
                  <div className="h-5 bg-gray-900 flex items-center justify-center">
                    <div className="w-16 h-1.5 bg-gray-700 rounded-full" />
                  </div>
                  <div className="bg-gradient-to-b from-blue-900 to-slate-900 px-3 py-4">
                    <div className="h-2 w-20 bg-blue-400/30 rounded-full mb-2" />
                    <div className="h-4 w-36 bg-white/20 rounded-md mb-1.5" />
                    <div className="h-4 w-28 bg-white/15 rounded-md mb-4" />
                    <div className="h-7 w-24 bg-blue-500 rounded-lg mb-6" />
                    <div className="grid grid-cols-2 gap-1.5">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-white/5 rounded-lg p-2">
                          <div className="h-1.5 w-12 bg-white/20 rounded mb-1" />
                          <div className="h-1 w-16 bg-white/10 rounded" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              {/* Tick badge */}
              <div className="absolute -right-4 top-1/2 -translate-y-1/2 bg-white rounded-xl shadow-lg border border-gray-100 px-2.5 py-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                    <Check size={11} className="text-green-600" strokeWidth={3} />
                  </div>
                  <span className="text-[10px] font-bold text-gray-800">Mobile<br />perfect</span>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-600 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-5">
              Mobile first
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-5">
              60% of your customers are on mobile — is your website ready?
            </h2>
            <p className="text-gray-500 text-lg leading-relaxed mb-6">
              A website that doesn&apos;t work on mobile loses customers instantly. Every site we build is designed mobile-first, so it looks great and loads fast on every device.
            </p>
            <ul className="space-y-3">
              {[
                "Loads in under 2 seconds on mobile",
                "Buttons and forms that are easy to tap",
                "Readable text without zooming in",
                "Google favours mobile-friendly sites in search",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check size={11} className="text-blue-600" strokeWidth={3} />
                  </div>
                  <span className="text-gray-700 text-sm font-medium">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── How it works ──────────────────────────────────────────────────────────────

function HowItWorks() {
  const steps = [
    {
      num: "01",
      title: "Fill in your brief",
      desc: "Tell us about your business, your services, and what you want from your website. Takes about 10 minutes — and we guide you through every question.",
      icon: Edit3,
    },
    {
      num: "02",
      title: "We build it for you",
      desc: "Our team designs and builds your site. You'll get to review it and request changes before anything goes live. No tech knowledge needed on your part.",
      icon: Zap,
    },
    {
      num: "03",
      title: "Go live & get found",
      desc: "We launch your site, submit it to Google, and set up your hosting. You start getting enquiries — we stay on hand for any ongoing updates or support.",
      icon: TrendingUp,
    },
  ];

  return (
    <section id="how-it-works" className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-600 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4">
            A simple process
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
            Your website in 3 simple steps
          </h2>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">
            We&apos;ve made getting online as straightforward as possible. No jargon, no confusion — just a great website.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-10">
          {steps.map(({ num, title, desc, icon: Icon }, i) => (
            <div key={num} className="relative">
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-10 left-[calc(100%-1rem)] w-full h-0.5 bg-gradient-to-r from-blue-200 to-blue-100" style={{ width: "calc(100% - 2rem)" }} />
              )}
              <div className="bg-blue-50 rounded-2xl p-6 lg:p-8">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-200">
                    <Icon size={19} className="text-white" />
                  </div>
                  <span className="text-3xl font-black text-blue-100 select-none">{num}</span>
                </div>
                <h3 className="font-extrabold text-lg text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Examples ──────────────────────────────────────────────────────────────────

const EXAMPLES = [
  {
    name: "Begu Carpentry",
    type: "Carpenter",
    location: "London",
    color: "from-amber-800 to-amber-950",
    accent: "#d97706",
    url: "begucarpentry.com",
  },
  {
    name: "Lumière Beauty Studio",
    type: "Beauty Salon",
    location: "Manchester",
    color: "from-rose-800 to-rose-950",
    accent: "#c9a96e",
    url: "example-beauty.co.uk",
  },
  {
    name: "A&B Plumbing",
    type: "Plumber",
    location: "Birmingham",
    color: "from-blue-800 to-blue-950",
    accent: "#3b82f6",
    url: "example-plumber.co.uk",
  },
  {
    name: "GreenLeaf Landscapes",
    type: "Landscaper",
    location: "Bristol",
    color: "from-green-800 to-green-950",
    accent: "#22c55e",
    url: "example-landscaper.co.uk",
  },
];

function Examples() {
  return (
    <section id="examples" className="py-20 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-600 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4">
            Real examples
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
            Websites we&apos;ve built for UK businesses
          </h2>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">
            Professional, modern websites that help businesses stand out and win more work.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          {EXAMPLES.map(({ name, type, location, color, accent, url }) => (
            <div
              key={name}
              className="group bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl hover:border-gray-300 transition-all duration-300"
            >
              {/* Fake site preview */}
              <div className={`bg-gradient-to-br ${color} h-52 relative overflow-hidden`}>
                {/* Fake nav */}
                <div className="absolute top-0 left-0 right-0 h-10 bg-black/20 backdrop-blur-sm flex items-center px-4 justify-between">
                  <div className="w-16 h-3 bg-white/30 rounded" />
                  <div className="flex gap-3">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="w-8 h-2 bg-white/20 rounded" />
                    ))}
                  </div>
                  <div className="w-16 h-6 rounded-md" style={{ backgroundColor: `${accent}80` }} />
                </div>
                {/* Fake hero content */}
                <div className="absolute top-16 left-6 right-6">
                  <div className="h-2.5 w-20 bg-white/30 rounded-full mb-2.5" style={{ backgroundColor: `${accent}60` }} />
                  <div className="h-6 w-48 bg-white/25 rounded-lg mb-1.5" />
                  <div className="h-6 w-36 bg-white/20 rounded-lg mb-4" />
                  <div className="h-8 w-28 rounded-lg" style={{ backgroundColor: accent }} />
                </div>
                {/* Trust bar at bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-10 bg-black/30 flex items-center px-4 gap-6">
                  {["★ 4.9", "200+ Reviews", "10yr exp"].map((t) => (
                    <span key={t} className="text-xs text-white/70 font-medium">{t}</span>
                  ))}
                </div>
              </div>

              {/* Card info */}
              <div className="p-5 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-900 mb-0.5">{name}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-medium">{type}</span>
                    <span className="flex items-center gap-1"><MapPin size={11} />{location}</span>
                  </div>
                </div>
                <div className="text-xs text-gray-400 font-medium">{url}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 text-blue-600 font-semibold text-sm hover:text-blue-700 transition-colors"
          >
            Talk to us about your website <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </section>
  );
}

// ── Testimonials ──────────────────────────────────────────────────────────────

const TESTIMONIALS = [
  {
    quote: "I was sceptical about using a smaller agency but Riden delivered a website that looks better than my competitors who paid three times as much. Enquiries doubled in the first month.",
    name: "James B.",
    role: "Electrician, London",
    rating: 5,
  },
  {
    quote: "The whole process was so easy. I filled in the brief, they built it, and I was live in 3 days. The team are always quick to respond when I need an update.",
    name: "Sarah M.",
    role: "Beauty Therapist, Manchester",
    rating: 5,
  },
  {
    quote: "Finally showing up on Google for my local area. I get 4-5 new enquiries a week just from the website now. Best money I've spent on the business.",
    name: "Dave T.",
    role: "Plumber, Birmingham",
    rating: 5,
  },
];

function Testimonials() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-600 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4">
            Customer reviews
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
            Trusted by hundreds of UK businesses
          </h2>
          <div className="flex items-center justify-center gap-2 mb-2">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={20} className="text-amber-400 fill-amber-400" />
            ))}
            <span className="text-xl font-bold text-gray-900 ml-1">4.9/5</span>
          </div>
          <p className="text-gray-500">Based on 600+ verified reviews</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map(({ quote, name, role, rating }) => (
            <div key={name} className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
              <div className="flex gap-0.5 mb-4">
                {[...Array(rating)].map((_, i) => (
                  <Star key={i} size={14} className="text-amber-400 fill-amber-400" />
                ))}
              </div>
              <p className="text-gray-700 text-sm leading-relaxed mb-5 italic">&ldquo;{quote}&rdquo;</p>
              <div>
                <div className="font-bold text-sm text-gray-900">{name}</div>
                <div className="text-xs text-gray-500">{role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Pricing ───────────────────────────────────────────────────────────────────

const PLANS = [
  {
    id: "pro",
    name: "Pro",
    setup: 299,
    monthly: 49,
    tagline: "Professional website. More calls.",
    popular: false,
    features: [
      "Professionally designed website",
      "Mobile responsive design",
      "Contact forms & gallery",
      "Reviews section",
      "Basic local SEO",
      "Google indexing",
      "Hosting & SSL included",
      "Custom domain",
      "Same-day text & image updates",
      "14-day money-back guarantee",
    ],
  },
  {
    id: "pro_plus",
    name: "Pro+",
    setup: 499,
    monthly: 99,
    tagline: "More enquiries. Stronger Google rankings.",
    popular: true,
    features: [
      "Everything in Pro",
      "Advanced local SEO",
      "Enhanced Google Business",
      "CRM integration",
      "Booking system",
      "Enhanced trust sections",
      "Service-specific ranking pages",
      "Priority support",
      "14-day money-back guarantee",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    setup: 999,
    monthly: 199,
    tagline: "Full growth system. Dominate local search.",
    popular: false,
    features: [
      "Everything in Pro+",
      "Multi-location SEO pages",
      "Area-specific landing pages",
      "Lead nurturing automation",
      "Analytics dashboard",
      "Seasonal campaigns",
      "Dedicated support",
      "Performance monitoring",
      "14-day money-back guarantee",
    ],
  },
];

function Pricing() {
  return (
    <section id="pricing" className="py-20 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-600 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4">
            Simple pricing
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
            Straightforward pricing. No hidden costs.
          </h2>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">
            One-off setup fee, then a simple monthly fee that covers everything — hosting, updates, support, and more.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 items-start">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl p-7 ${
                plan.popular
                  ? "bg-blue-600 text-white shadow-2xl shadow-blue-200 scale-105"
                  : "bg-white border border-gray-200 text-gray-900"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-900 text-xs font-bold px-3 py-1 rounded-full">
                  Most Popular
                </div>
              )}
              <div className="mb-6">
                <h3 className={`text-xl font-extrabold mb-1 ${plan.popular ? "text-white" : "text-gray-900"}`}>
                  {plan.name}
                </h3>
                <p className={`text-sm mb-5 ${plan.popular ? "text-blue-200" : "text-gray-500"}`}>
                  {plan.tagline}
                </p>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className={`text-4xl font-black ${plan.popular ? "text-white" : "text-gray-900"}`}>
                    £{plan.setup}
                  </span>
                  <span className={`text-sm font-medium ${plan.popular ? "text-blue-200" : "text-gray-400"}`}>
                    setup
                  </span>
                </div>
                <div className={`text-sm font-medium ${plan.popular ? "text-blue-200" : "text-gray-500"}`}>
                  then £{plan.monthly}/month
                </div>
              </div>

              <ul className="space-y-2.5 mb-7">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <Check
                      size={14}
                      className={`flex-shrink-0 mt-0.5 ${plan.popular ? "text-blue-200" : "text-blue-600"}`}
                      strokeWidth={3}
                    />
                    <span className={plan.popular ? "text-blue-50" : "text-gray-600"}>{f}</span>
                  </li>
                ))}
              </ul>

              <a
                href="/contact"
                className={`block w-full text-center py-3 rounded-xl text-sm font-bold transition-colors ${
                  plan.popular
                    ? "bg-white text-blue-600 hover:bg-blue-50"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                Get started with {plan.name}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── FAQ ───────────────────────────────────────────────────────────────────────

const FAQS = [
  {
    q: "How quickly can you build my website?",
    a: "Most websites are built and ready to review within 2–5 business days of us receiving your brief. After your review and any revisions, we aim to have you live within the week.",
  },
  {
    q: "Do I need to know anything technical?",
    a: "Not at all. We handle everything — design, development, hosting, and Google setup. You just tell us about your business and we do the rest. If you ever need a change, just message us.",
  },
  {
    q: "What does the monthly fee cover?",
    a: "The monthly fee covers your website hosting, SSL certificate, ongoing support, and unlimited content updates (text and images). There are no hidden extras.",
  },
  {
    q: "Can I keep my existing domain name?",
    a: "Yes — we can use your existing domain or help you register a new one. Either way, we handle the setup for you.",
  },
  {
    q: "What if I'm not happy with the design?",
    a: "We offer a 14-day money-back guarantee. If you're genuinely unhappy after we've built your site and made revisions, we'll give you a full refund — no questions asked.",
  },
  {
    q: "Do you work with businesses outside London?",
    a: "Yes — we work with businesses all across the UK. Everything is done remotely, so your location doesn't matter at all.",
  },
  {
    q: "Will I be able to see my site before it goes live?",
    a: "Absolutely. We'll send you a preview link before anything goes live so you can review the design and request any changes.",
  },
  {
    q: "Can you help with Google and SEO?",
    a: "Yes. All our websites include local SEO setup — your site will be submitted to Google and optimised so you can be found for searches in your area. Our Pro+ and Enterprise plans include more advanced SEO work.",
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-200 last:border-0">
      <button
        className="w-full flex items-center justify-between text-left py-5 gap-4"
        onClick={() => setOpen(!open)}
      >
        <span className="font-semibold text-gray-900 text-sm sm:text-base">{q}</span>
        {open
          ? <ChevronUp size={18} className="text-blue-600 flex-shrink-0" />
          : <ChevronDown size={18} className="text-gray-400 flex-shrink-0" />
        }
      </button>
      {open && (
        <p className="text-sm text-gray-500 leading-relaxed pb-5">{a}</p>
      )}
    </div>
  );
}

function FAQ() {
  return (
    <section id="faq" className="py-20 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-600 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4">
            FAQ
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
            Got questions? We&apos;ve got answers.
          </h2>
          <p className="text-gray-500">
            Can&apos;t find what you&apos;re looking for?{" "}
            <Link href="/contact" className="text-blue-600 font-medium hover:underline">
              Contact us
            </Link>
          </p>
        </div>

        <div className="bg-gray-50 rounded-2xl border border-gray-200 px-6">
          {FAQS.map((item) => (
            <FAQItem key={item.q} {...item} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ── CTA banner ────────────────────────────────────────────────────────────────

function CTABanner() {
  return (
    <section className="py-20 bg-blue-600">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
          Ready to get your website?
        </h2>
        <p className="text-blue-200 text-lg mb-8 max-w-xl mx-auto">
          Join 500+ UK businesses that trust Riden Technologies. Get online in days, not months.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/contact"
            className="inline-flex items-center justify-center gap-2 bg-white text-blue-600 hover:bg-blue-50 font-bold text-base px-7 py-3.5 rounded-xl transition-colors shadow-lg"
          >
            Claim your website today <ArrowRight size={16} />
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center gap-2 border-2 border-blue-400 text-white hover:bg-blue-700 font-semibold text-base px-7 py-3.5 rounded-xl transition-colors"
          >
            Book a free call
          </Link>
        </div>
        <p className="text-blue-300 text-sm mt-6">No commitment. 14-day money-back guarantee on all plans.</p>
      </div>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────

function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-gray-900 text-gray-400">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
                <Zap size={16} className="text-white" strokeWidth={2.5} />
              </div>
              <span className="font-bold text-lg text-white">Riden Technologies</span>
            </div>
            <p className="text-sm leading-relaxed max-w-xs text-gray-500">
              Professional websites for UK tradespeople and small businesses. Fast, affordable, and built to get you found online.
            </p>
          </div>
          <div>
            <h4 className="text-white text-sm font-semibold mb-3">Company</h4>
            <ul className="space-y-2 text-sm">
              {[
                { label: "About", href: "/about" },
                { label: "Contact", href: "/contact" },
                { label: "Pricing", href: "#pricing" },
                { label: "Login", href: "/login" },
              ].map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="hover:text-white transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-white text-sm font-semibold mb-3">Legal</h4>
            <ul className="space-y-2 text-sm">
              {[
                { label: "Privacy Policy", href: "/privacy" },
                { label: "Terms of Service", href: "/terms" },
                { label: "Cookie Policy", href: "/cookies" },
                { label: "Refund Policy", href: "/refund-policy" },
              ].map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="hover:text-white transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
          <p>&copy; {year} Riden Technologies Ltd. All rights reserved.</p>
          <p className="text-gray-600">hello@ridentechnologies.com</p>
        </div>
      </div>
    </footer>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div className="bg-white min-h-screen font-sans">
      <Nav />
      <Hero />
      <StatsStrip />
      <Features />
      <MobileSection />
      <HowItWorks />
      <Examples />
      <Testimonials />
      <Pricing />
      <FAQ />
      <CTABanner />
      <Footer />
    </div>
  );
}
