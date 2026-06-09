import type { MetadataRoute } from "next";

const BASE = "https://ridentechnologies.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: BASE, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE}/solutions`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/pricing`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${BASE}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${BASE}/cookies`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${BASE}/acceptable-use`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${BASE}/refund-policy`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];
}
