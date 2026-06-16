import { runWebsiteBriefQaAgent } from './website-brief-qa-agent';

type Jsonish = Record<string, unknown>;

export type GoogleReview = {
  author: string;
  rating: number;
  body: string;
  source: 'google';
  date: string;
};

export type GoogleBusinessBriefPatch = {
  phone?: string;
  email?: string;
  city?: string;
  postcode?: string;
  industry?: string;
  services?: string;
  about?: string;
  openingHours?: string;
  reviewsJson?: string;
  photosJson?: string;
};

function str(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function num(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function isBlank(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  return trimmed === '' || trimmed === '[]' || trimmed === '{}';
}

function inferIndustryFromGoogleItem(item: Jsonish): string {
  const text = [
    item.categoryName,
    item.category,
    ...(Array.isArray(item.categories) ? item.categories : []),
  ].map(String).join(' ').toLowerCase();
  if (/plumb|electric|roof|build|carpen|paint|decorat|heating|drain|garage|mechanic/.test(text)) return 'trades';
  if (/beauty|salon|spa|nail|lash|hair|barber|aesthetic/.test(text)) return 'beauty';
  if (/restaurant|cafe|bar|pub|hotel|takeaway|food/.test(text)) return 'hospitality';
  if (/doctor|dentist|clinic|health|physio|therapy/.test(text)) return 'health';
  if (/shop|store|retail/.test(text)) return 'retail';
  return 'professional';
}

function extractServices(item: Jsonish): string {
  const reviewsTags = Array.isArray(item.reviewsTags) ? item.reviewsTags as Jsonish[] : [];
  const skipTags = new Set([
    'knowledgeable staff', 'welcoming staff', 'friendly staff', 'great service',
    'good service', 'excellent service', 'skilled team', 'professional staff',
    'clear explanations', 'tailored treatment', 'hygienic setting', 'clean environment',
  ]);

  const tagServices = reviewsTags
    .map((tag) => ({ title: str(tag.title), count: num(tag.count) ?? 0 }))
    .filter((tag) => tag.title && !skipTags.has(tag.title.toLowerCase()))
    .sort((a, b) => b.count - a.count)
    .map((tag) => tag.title);
  if (tagServices.length > 0) return [...new Set(tagServices)].join('\n');

  const categories = Array.isArray(item.categories) ? item.categories.map(String).filter(Boolean) : [];
  if (categories.length > 0) return [...new Set(categories)].join('\n');

  return str(item.categoryName ?? item.category);
}

function buildAbout(item: Jsonish): string {
  const desc = str(item.description ?? item.editorialSummary ?? item.aboutFromGoogle);
  if (desc.length > 30) return desc;

  const name = str(item.title ?? item.name);
  const city = str(item.city);
  const categories = Array.isArray(item.categories) ? item.categories.map(String).filter(Boolean) : [];
  const catText = categories.length > 0 ? categories.slice(0, 2).join(' & ').toLowerCase() : str(item.categoryName ?? item.category).toLowerCase();
  const rating = num(item.totalScore ?? item.rating);
  const reviews = num(item.reviewsCount ?? item.reviews_count ?? item.reviewCount);
  const services = extractServices(item).split('\n').filter(Boolean).slice(0, 4);

  const parts: string[] = [];
  if (name) {
    const type = catText ? `, a ${catText}` : '';
    const loc = city ? ` based in ${city}` : '';
    parts.push(`${name}${type}${loc}.`);
  }
  if (services.length > 0) parts.push(`Specialising in ${services.join(', ')}.`);
  if (rating !== null && reviews !== null) parts.push(`Rated ${rating.toFixed(1)}/5 on Google with ${reviews} reviews.`);
  return parts.join(' ');
}

function extractReviews(item: Jsonish): GoogleReview[] {
  const rawReviews = Array.isArray(item.reviews) ? item.reviews as Jsonish[] : [];
  return rawReviews
    .filter((r) => str(r.text ?? r.body).length > 0)
    .map((r) => ({
      author: str(r.name ?? r.author) || 'Google User',
      rating: num(r.stars ?? r.rating) ?? 5,
      body: str(r.text ?? r.body),
      source: 'google' as const,
      date: str(r.publishedAtDate ?? r.date),
    }));
}

function extractImageUrl(image: unknown): string | null {
  if (typeof image === 'string' && image.startsWith('http')) return image;
  if (image && typeof image === 'object') {
    const obj = image as Jsonish;
    const url = str(obj.imageUrl ?? obj.url);
    return url.startsWith('http') ? url : null;
  }
  return null;
}

function extractPhotos(item: Jsonish): string[] {
  const urls: string[] = [];
  const add = (url: string | null) => {
    if (url && !urls.includes(url)) urls.push(url);
  };
  add(extractImageUrl(item.imageUrl));
  for (const key of ['imageUrls', 'images', 'photos'] as const) {
    const value = item[key];
    if (Array.isArray(value)) for (const image of value) add(extractImageUrl(image));
  }
  return urls.slice(0, 20);
}

function formatOpeningHours(item: Jsonish): string {
  const openingHours = item.openingHours;
  if (typeof openingHours === 'string') return openingHours;
  if (!Array.isArray(openingHours)) return '';
  return openingHours
    .map((h) => {
      if (typeof h === 'string') return h;
      if (!h || typeof h !== 'object') return '';
      const row = h as Jsonish;
      const day = str(row.day ?? row.dayOfWeek);
      const hours = str(row.hours ?? row.time ?? row.openingHours);
      return day || hours ? `${day}: ${hours}`.trim() : '';
    })
    .filter(Boolean)
    .join(', ');
}

export function buildGoogleBusinessBriefPatch(item: Jsonish, options: { projectName?: string } = {}): GoogleBusinessBriefPatch {
  const mapsUrl = str(item.url ?? item.maps_url ?? item.googleMapsUrl);
  const rating = num(item.totalScore ?? item.rating);
  const reviewCount = num(item.reviewsCount ?? item.reviews_count ?? item.reviewCount);
  const photos = extractPhotos(item);
  const reviews = extractReviews(item);
  const newId = (i: number) => `google_photo_${i}`;
  const reviewSettings = {
    platform: 'Google',
    reviewCount: reviewCount ?? undefined,
    averageRating: rating !== null ? `${rating.toFixed(1)}/5` : '',
    platformUrl: mapsUrl,
    showReviewBadge: true,
    showRatingBadge: true,
  };

  const photoAltBase = options.projectName ?? (str(item.title ?? item.name) || 'Business');
  const photosJson = JSON.stringify({
    logo: '',
    heroImages: photos[0] ? [photos[0]] : [],
    hero: photos[0] ?? '',
    heroMobile: '',
    gallery: photos,
    projectAlbums: photos.length > 0 ? [{
      id: 'google_photos',
      title: 'Google Photos',
      description: 'Imported from Google Business Profile.',
      category: '',
      sourceUrl: mapsUrl,
      coverImageUrl: photos[0],
      enabled: true,
      displayOrder: 0,
      photos: photos.map((url, i) => ({ id: newId(i), url, alt: `${photoAltBase} photo ${i + 1}`, caption: '', displayOrder: i })),
    }] : [],
    heroHotspots: [],
    colours: { primary: '', secondary: '', tertiary: '' },
    trustCards: [
      { id: 'avg-rating', title: 'Average Rating', value: rating !== null ? rating.toFixed(1) : '', icon: 'star', location: ['hero'], enabled: rating !== null },
      { id: 'reviews', title: 'Reviews', value: reviewCount !== null ? `${reviewCount}` : '', icon: 'award', location: ['hero'], enabled: reviewCount !== null },
    ],
    aboutProofCards: [],
    reviewSettings,
  });

  return {
    phone: str(item.phone) || undefined,
    email: str(item.email) || undefined,
    city: str(item.city) || undefined,
    postcode: str(item.postalCode ?? item.postCode ?? item.postal_code) || undefined,
    industry: inferIndustryFromGoogleItem(item),
    services: extractServices(item) || undefined,
    about: buildAbout(item) || undefined,
    openingHours: formatOpeningHours(item) || undefined,
    reviewsJson: JSON.stringify(reviews),
    photosJson,
  };
}

function parsePlainPhotoArray(value: unknown): string[] | null {
  if (typeof value !== 'string' || isBlank(value)) return null;
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed) && parsed.every((p) => typeof p === 'string')) return parsed;
  } catch {}
  return null;
}

function upgradePlainPhotosIntoPatch(existingPhotos: string[], patchPhotosJson: string): string {
  try {
    const rich = JSON.parse(patchPhotosJson) as Jsonish;
    const gallery: string[] = Array.isArray(rich.gallery) ? rich.gallery.map(String) : [];
    for (const url of existingPhotos) {
      if (url && !gallery.includes(url)) gallery.push(url);
    }
    rich.gallery = gallery;
    return JSON.stringify(rich);
  } catch {
    return patchPhotosJson;
  }
}

function isMachinePrefilledPossibleClient(existing: Jsonish): boolean {
  return existing.source === 'possible_client_import'
    || /Auto-created from Possible Client import|Brief fields were prefilled from scraped business data/i.test(str(existing.notes));
}

export function mergeBriefPatchPreservingEdits({
  existing,
  patch,
  preserveMachinePrefill = true,
}: {
  existing: Jsonish;
  patch: GoogleBusinessBriefPatch;
  preserveMachinePrefill?: boolean;
}) {
  const merged: GoogleBusinessBriefPatch = { ...patch };
  const allowMachinePrefillOverwrite = !preserveMachinePrefill && isMachinePrefilledPossibleClient(existing);
  const machinePrefillKeys = new Set<keyof GoogleBusinessBriefPatch>([
    'phone',
    'email',
    'city',
    'postcode',
    'industry',
    'services',
    'about',
    'openingHours',
    'reviewsJson',
    'photosJson',
  ]);
  for (const key of Object.keys(patch) as (keyof GoogleBusinessBriefPatch)[]) {
    if (isBlank(existing[key])) continue;
    if (allowMachinePrefillOverwrite && machinePrefillKeys.has(key)) {
      if (key === 'photosJson' && patch.photosJson) {
        const plainPhotos = parsePlainPhotoArray(existing[key]);
        if (plainPhotos !== null) merged.photosJson = upgradePlainPhotosIntoPatch(plainPhotos, patch.photosJson);
      }
      continue;
    }

    // photosJson stored as a plain string array is machine prefill from the
    // possible-client import, not a human edit. Upgrade it to the rich Google
    // structure (review settings, albums, trust cards) and fold the existing
    // URLs into the gallery so no photos are lost. A rich object photosJson is
    // treated as human-edited and preserved as-is.
    if (key === 'photosJson' && patch.photosJson) {
      const plainPhotos = parsePlainPhotoArray(existing[key]);
      if (plainPhotos !== null) {
        merged.photosJson = upgradePlainPhotosIntoPatch(plainPhotos, patch.photosJson);
        continue;
      }
    }

    merged[key] = existing[key] as string;
  }
  return merged;
}

export function mergeGoogleBusinessPatchAndRunQa({
  businessName,
  existing,
  patch,
  preserveMachinePrefill = true,
}: {
  businessName: string;
  existing: Jsonish;
  patch: GoogleBusinessBriefPatch;
  preserveMachinePrefill?: boolean;
}) {
  const merged = mergeBriefPatchPreservingEdits({ existing, patch, preserveMachinePrefill });
  let reviews: Array<{ author?: string; rating?: number; body?: string; source?: string; date?: string }> = [];
  try {
    const parsed = JSON.parse(merged.reviewsJson ?? '[]');
    if (Array.isArray(parsed)) reviews = parsed;
  } catch {}

  const qa = runWebsiteBriefQaAgent({
    businessName,
    brief: {
      ...existing,
      ...merged,
    },
    reviews,
    photosJson: merged.photosJson ?? '{}',
  });

  return {
    ...merged,
    phone: typeof qa.brief.phone === 'string' ? qa.brief.phone : merged.phone,
    email: typeof qa.brief.email === 'string' ? qa.brief.email : merged.email,
    city: typeof qa.brief.city === 'string' ? qa.brief.city : merged.city,
    postcode: typeof qa.brief.postcode === 'string' ? qa.brief.postcode : merged.postcode,
    industry: typeof qa.brief.industry === 'string' ? qa.brief.industry : merged.industry,
    services: typeof qa.brief.services === 'string' ? qa.brief.services : merged.services,
    about: typeof qa.brief.about === 'string' ? qa.brief.about : merged.about,
    openingHours: typeof qa.brief.openingHours === 'string' ? qa.brief.openingHours : merged.openingHours,
    photosJson: JSON.stringify(qa.photosJson),
  } satisfies GoogleBusinessBriefPatch;
}
