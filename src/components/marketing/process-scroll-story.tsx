"use client";

// ─── Flagship scroll-storytelling section ────────────────────────────────────
// A sticky, scroll-driven walk through the 6-stage Riden process. The pinned
// panel crossfades between coded scenes (no AI, real text) as the user scrolls.
// Reduced-motion and small screens get a clean stacked layout (no pinning).

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import {
  ClipboardList,
  LayoutTemplate,
  MonitorSmartphone,
  Search,
  ShieldCheck,
  MessageSquareText,
  MapPin,
  Star,
  PhoneCall,
  Mail,
  Check,
  ArrowRight,
} from "lucide-react";

import { AiBackdrop } from "@/components/marketing/visuals/ai-backdrop";
import {
  BrowserMock,
  TabletMock,
  PhoneMock,
  MiniSite,
  MiniSiteMobile,
  ScaledFrame,
  type SiteTheme,
} from "@/components/marketing/visuals/device-mocks";

const SCENE_THEME: SiteTheme = {
  name: "Harper Plumbing",
  tagline: "Local plumbing & heating you can rely on.",
  accent: "#2563eb",
  accent2: "#06b6d4",
  services: ["Boilers & Heating", "Bathrooms", "Emergency Call-Out"],
  cta: "Get a Quote",
};

interface Stage {
  n: string;
  eyebrow: string;
  title: string;
  message: string;
  icon: typeof ClipboardList;
  Scene: () => React.ReactElement;
}

const stages: Stage[] = [
  {
    n: "01",
    eyebrow: "Business Discovery",
    title: "Tell us about your business",
    message:
      "We start with your business, your services and the customers you want more of. Your details, brief and goals all in one place.",
    icon: ClipboardList,
    Scene: DiscoveryScene,
  },
  {
    n: "02",
    eyebrow: "Website Design",
    title: "We design your website",
    message:
      "Your wireframe is shaped into a polished, modern website that looks the part and reflects your brand.",
    icon: LayoutTemplate,
    Scene: DesignScene,
  },
  {
    n: "03",
    eyebrow: "Responsive Build",
    title: "Built for every device",
    message:
      "Every page is built to look and work beautifully on desktop, tablet and mobile, wherever your customers find you.",
    icon: MonitorSmartphone,
    Scene: ResponsiveScene,
  },
  {
    n: "04",
    eyebrow: "SEO Optimisation",
    title: "Built to be found online",
    message:
      "Search rankings, Google Maps presence and service visibility are set up so nearby customers actually find you.",
    icon: Search,
    Scene: SeoScene,
  },
  {
    n: "05",
    eyebrow: "Website Maintenance",
    title: "We manage everything",
    message:
      "Updates, hosting, security and support are all handled for you. Send us a change and we take care of it.",
    icon: ShieldCheck,
    Scene: MaintenanceScene,
  },
  {
    n: "06",
    eyebrow: "More Enquiries",
    title: "Designed to generate enquiries",
    message:
      "Contact requests, calls and leads are funnelled straight to you. The whole site is built to turn visitors into work.",
    icon: MessageSquareText,
    Scene: EnquiriesScene,
  },
];

export default function ProcessScrollStory() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);
  const [enhanced, setEnhanced] = useState(false);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  useEffect(() => {
    const mqMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setEnhanced(!mqMotion.matches);
    apply();
    mqMotion.addEventListener("change", apply);
    return () => {
      mqMotion.removeEventListener("change", apply);
    };
  }, []);

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setProgress(v);
    const i = Math.min(stages.length - 1, Math.max(0, Math.floor(v * stages.length)));
    setActive(i);
  });

  // ── Stacked layout (reduced-motion only): no pin, every stage visible ──
  if (!enhanced) {
    return (
      <section
        ref={sectionRef}
        id="how-it-works"
        className="relative overflow-hidden bg-gradient-to-b from-white to-[#f6faff] py-20 sm:py-24"
        aria-label="How Riden builds and manages your website"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <StoryHeader />
          <div className="mt-14 space-y-10 sm:space-y-16 md:space-y-24">
            {stages.map((s, i) => {
              const Scene = s.Scene;
              const flip = i % 2 === 1;
              return (
                <motion.div
                  key={s.n}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.5 }}
                  className="grid items-center gap-8 md:grid-cols-2 md:gap-12"
                >
                  <div className={flip ? "md:order-2" : ""}>
                    <StageCopy stage={s} />
                  </div>
                  <div className={`hidden justify-center md:flex ${flip ? "md:order-1" : ""}`}>
                    <Scene />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  // ── Pinned scroll-storytelling (desktop) ───────────────────────────────────
  return (
    <section
      ref={sectionRef}
      id="how-it-works"
      className="relative bg-gradient-to-b from-white to-[#f4f9ff]"
      style={{ height: `${stages.length * 85}vh` }}
      aria-label="How Riden builds and manages your website"
    >
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        <AiBackdrop name="mesh" opacity={0.32} />

        {/* progress bar */}
        <div className="absolute left-0 top-0 z-20 h-1 w-full bg-slate-100">
          <div
            className="h-full bg-gradient-to-r from-blue-600 to-cyan-400"
            style={{ width: `${progress * 100}%` }}
          />
        </div>

        <div className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr]">
          {/* left: copy + stage rail */}
          <div className="relative">
            <div className="mb-5 lg:mb-8">
              <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-blue-700 ring-1 ring-blue-100">
                How it works
              </span>
              <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl lg:mt-4 lg:text-4xl">
                From first chat to{" "}
                <span className="gradient-text-brand">more enquiries</span>
              </h2>
            </div>

            {/* crossfading stage copy */}
            <div className="relative min-h-[15rem] sm:min-h-[13rem]">
              {stages.map((s, i) => (
                <div
                  key={s.n}
                  className={`absolute inset-0 transition-all duration-500 ease-out ${
                    i === active
                      ? "translate-y-0 opacity-100"
                      : i < active
                        ? "-translate-y-3 opacity-0"
                        : "translate-y-3 opacity-0"
                  }`}
                  aria-hidden={i !== active}
                >
                  <StageCopy stage={s} large />
                </div>
              ))}
            </div>

            {/* stage rail */}
            <ol className="mt-6 flex flex-wrap gap-2 lg:mt-8">
              {stages.map((s, i) => (
                <li
                  key={s.n}
                  className={`flex h-8 items-center gap-1.5 rounded-full px-3 text-[11px] font-bold transition-all duration-300 ${
                    i === active
                      ? "bg-slate-900 text-white"
                      : i < active
                        ? "bg-blue-100 text-blue-700"
                        : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {i < active ? <Check className="h-3 w-3" /> : <span>{s.n}</span>}
                </li>
              ))}
            </ol>
          </div>

          {/* right: crossfading scene — hidden on mobile/tablet, shown on desktop */}
          <div className="relative hidden h-[26rem] lg:block">
            {stages.map((s, i) => {
              const Scene = s.Scene;
              return (
                <div
                  key={s.n}
                  className={`absolute inset-0 flex items-center justify-center transition-all duration-700 ease-out ${
                    i === active
                      ? "scale-100 opacity-100 blur-0"
                      : i < active
                        ? "scale-95 opacity-0 blur-sm"
                        : "scale-105 opacity-0 blur-sm"
                  }`}
                  aria-hidden={i !== active}
                >
                  <Scene />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── shared bits ──────────────────────────────────────────────────────────── */

function StoryHeader() {
  return (
    <div className="text-center">
      <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-blue-700 ring-1 ring-blue-100">
        How it works
      </span>
      <h2 className="mx-auto mt-4 max-w-xl text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
        From first chat to <span className="gradient-text-brand">more enquiries</span>
      </h2>
      <p className="mx-auto mt-4 max-w-lg text-base text-slate-600">
        Six simple steps. We handle the design, build, SEO and ongoing maintenance. You focus on
        the work.
      </p>
    </div>
  );
}

function StageCopy({ stage, large = false }: { stage: Stage; large?: boolean }) {
  const Icon = stage.icon;
  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-600/25">
          <Icon className="h-5 w-5" />
        </span>
        <div className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">
          {stage.n} · {stage.eyebrow}
        </div>
      </div>
      <h3
        className={`mt-4 font-bold tracking-tight text-slate-900 ${
          large ? "text-2xl sm:text-3xl lg:text-[2.4rem]" : "text-xl sm:text-2xl"
        }`}
      >
        {stage.title}
      </h3>
      <p className="mt-3 max-w-md text-base leading-relaxed text-slate-600">{stage.message}</p>
    </div>
  );
}

function SceneCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative w-full max-w-md" aria-hidden="true">
      <div className="absolute -inset-5 -z-10 rounded-[2.5rem] bg-gradient-to-br from-blue-200/40 via-cyan-100/30 to-transparent blur-2xl" />
      {children}
    </div>
  );
}

/* ── Scenes (coded, no AI, real text) ──────────────────────────────────────── */

function DiscoveryScene() {
  return (
    <SceneCard>
      <div className="space-y-3">
        {/* business card */}
        <div className="glass-panel flex items-center gap-3 rounded-2xl p-4">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 text-sm font-bold text-white">
            HP
          </span>
          <div>
            <div className="text-sm font-bold text-slate-900">Harper Plumbing</div>
            <div className="text-xs text-slate-500">Plumbing &amp; Heating · Manchester</div>
          </div>
        </div>
        {/* project brief */}
        <div className="rounded-2xl bg-white p-4 shadow-float ring-1 ring-slate-100">
          <div className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
            Project brief
          </div>
          <ul className="mt-3 space-y-2">
            {["Services & areas covered", "Photos & reviews", "Goals: more enquiries"].map((t) => (
              <li key={t} className="flex items-center gap-2 text-xs font-medium text-slate-700">
                <Check className="h-3.5 w-3.5 text-emerald-500" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </SceneCard>
  );
}

function DesignScene() {
  return (
    <SceneCard>
      <div className="relative">
        {/* wireframe behind */}
        <div className="absolute -left-6 -top-6 w-2/3 rotate-[-4deg] rounded-xl border-2 border-dashed border-blue-200 bg-white/70 p-3">
          <div className="h-2 w-1/2 rounded bg-slate-200" />
          <div className="mt-2 h-10 w-full rounded bg-slate-100" />
          <div className="mt-2 grid grid-cols-3 gap-1.5">
            <div className="h-6 rounded bg-slate-100" />
            <div className="h-6 rounded bg-slate-100" />
            <div className="h-6 rounded bg-slate-100" />
          </div>
        </div>
        {/* polished site in front */}
        <div className="relative ml-10 mt-6">
          <BrowserMock url="www.harperplumbing.co.uk">
            <ScaledFrame width={440}>
              <MiniSite theme={SCENE_THEME} />
            </ScaledFrame>
          </BrowserMock>
        </div>
      </div>
    </SceneCard>
  );
}

function ResponsiveScene() {
  return (
    <div className="relative w-full max-w-xl px-3 pb-6" aria-hidden="true">
      <div className="absolute -inset-5 -z-10 rounded-[2.5rem] bg-gradient-to-br from-blue-200/40 via-cyan-100/30 to-transparent blur-2xl" />

      <div className="relative mx-auto min-h-[19rem]">
        {/* Desktop preview stays central so it reads clearly. */}
        <div className="relative z-10 mx-auto w-[86%]">
          <BrowserMock url="harperplumbing.co.uk">
            <ScaledFrame width={440}>
              <MiniSite theme={SCENE_THEME} />
            </ScaledFrame>
          </BrowserMock>
        </div>

        {/* Tablet and phone sit inside the composition instead of hanging off the edge. */}
        <div className="absolute bottom-5 left-0 z-20 w-40 -rotate-3 drop-shadow-2xl sm:w-44">
          <TabletMock className="border-[5px]">
            <MiniTabletPreview />
          </TabletMock>
        </div>

        <div className="absolute bottom-1 right-7 z-30 w-28 rotate-2 drop-shadow-2xl sm:right-10 sm:w-32">
          <PhoneMock className="border-[5px]">
            <MiniPhonePreview />
          </PhoneMock>
        </div>
      </div>

      {/* Device labels */}
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {(["Desktop", "Tablet", "Mobile"] as const).map((d) => (
          <span
            key={d}
            className="flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-[11px] font-semibold text-blue-700 ring-1 ring-blue-100"
          >
            <Check className="h-3 w-3" />
            {d}
          </span>
        ))}
      </div>
    </div>
  );
}

function MiniTabletPreview() {
  return (
    <ScaledFrame width={480}>
      <MiniSite theme={SCENE_THEME} compact />
    </ScaledFrame>
  );
}

function MiniPhonePreview() {
  return (
    <ScaledFrame width={280}>
      <MiniSiteMobile theme={SCENE_THEME} />
    </ScaledFrame>
  );
}

function SeoScene() {
  return (
    <SceneCard>
      <div className="space-y-3">
        {/* search result */}
        <div className="rounded-2xl bg-white p-4 shadow-float ring-1 ring-slate-100">
          <div className="flex items-center gap-2 text-[11px] font-medium text-slate-400">
            <Search className="h-3.5 w-3.5" /> plumber near me
          </div>
          <div className="mt-3 rounded-lg bg-blue-50/60 p-2.5 ring-1 ring-blue-100">
            <div className="text-[11px] font-bold text-blue-700">Harper Plumbing, Manchester</div>
            <div className="text-[10px] text-slate-500">harperplumbing.co.uk · ★ 5.0 (48)</div>
          </div>
          {[1, 2].map((i) => (
            <div key={i} className="mt-2 px-2.5">
              <div className="h-2 w-1/3 rounded bg-slate-200" />
              <div className="mt-1 h-1.5 w-3/4 rounded bg-slate-100" />
            </div>
          ))}
        </div>
        {/* map + visibility */}
        <div className="flex gap-3">
          <div className="glass-panel flex flex-1 items-center gap-2 rounded-2xl p-3">
            <MapPin className="h-5 w-5 text-blue-600" />
            <div className="text-[11px] font-semibold text-slate-700">
              Top of Google Maps
            </div>
          </div>
          <div className="glass-panel flex flex-1 items-center gap-2 rounded-2xl p-3">
            <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
            <div className="text-[11px] font-semibold text-slate-700">Reviews showing</div>
          </div>
        </div>
      </div>
    </SceneCard>
  );
}

function MaintenanceScene() {
  const rows = [
    { icon: ShieldCheck, label: "SSL & security", value: "Active", color: "text-emerald-500" },
    { icon: MonitorSmartphone, label: "Hosting uptime", value: "99.9%", color: "text-blue-600" },
    { icon: Check, label: "Software updates", value: "Auto", color: "text-cyan-600" },
  ];
  return (
    <SceneCard>
      <div className="rounded-2xl bg-white p-5 shadow-float ring-1 ring-slate-100">
        <div className="flex items-center justify-between">
          <div className="text-sm font-bold text-slate-900">Managed for you</div>
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-600">
            All systems healthy
          </span>
        </div>
        <div className="mt-4 space-y-2.5">
          {rows.map((r) => {
            const Icon = r.icon;
            return (
              <div
                key={r.label}
                className="flex items-center justify-between rounded-xl bg-slate-50/70 px-3 py-2.5"
              >
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <Icon className={`h-4 w-4 ${r.color}`} /> {r.label}
                </div>
                <span className={`text-xs font-bold ${r.color}`}>{r.value}</span>
              </div>
            );
          })}
        </div>
        <div className="mt-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-3 py-2.5 text-center text-[11px] font-semibold text-white">
          “Add a new service page” → done same day
        </div>
      </div>
    </SceneCard>
  );
}

function EnquiriesScene() {
  const items = [
    { icon: Mail, title: "New enquiry", sub: "Bathroom refit quote", tone: "from-blue-500 to-cyan-500" },
    { icon: PhoneCall, title: "Incoming call", sub: "Tap-to-call from mobile", tone: "from-emerald-500 to-teal-500" },
    { icon: MessageSquareText, title: "New lead", sub: "Boiler service request", tone: "from-violet-500 to-fuchsia-500" },
  ];
  return (
    <SceneCard>
      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-2xl bg-slate-900 px-4 py-3 text-white">
          <div className="text-sm font-bold">Enquiries this week</div>
          <div className="text-2xl font-extrabold text-cyan-300">+24</div>
        </div>
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <div
              key={it.title}
              className="glass-panel flex items-center gap-3 rounded-2xl p-3.5"
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${it.tone} text-white`}
              >
                <Icon className="h-4 w-4" />
              </span>
              <div>
                <div className="text-xs font-bold text-slate-900">{it.title}</div>
                <div className="text-[11px] text-slate-500">{it.sub}</div>
              </div>
              <ArrowRight className="ml-auto h-4 w-4 text-slate-300" />
            </div>
          );
        })}
        <Link
          href="/contact"
          className="block rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-3 text-center text-sm font-semibold text-white"
        >
          Get My Website Preview
        </Link>
      </div>
    </SceneCard>
  );
}
