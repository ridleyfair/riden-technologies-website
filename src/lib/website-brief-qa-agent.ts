export type WebsiteBriefCore = {
  phone?: string;
  email?: string;
  city?: string;
  postcode?: string;
  industry?: string;
  services?: string;
  about?: string;
  aboutOriginal?: string;
  accreditations?: string;
  openingHours?: string;
  socialFacebook?: string;
  socialInstagram?: string;
  [key: string]: unknown;
};

export type WebsiteBriefQaPhoto = {
  id: string;
  url: string;
  filename?: string;
  alt?: string;
  caption?: string;
  category?: string;
  albumId?: string;
  isHeroCandidate?: boolean;
  isBeforePhoto?: boolean;
  isAfterPhoto?: boolean;
  beforeAfterPairId?: string;
  qualityScore?: number;
  orientation?: 'landscape' | 'portrait' | 'square' | 'unknown';
  width?: number;
  height?: number;
  source?: string;
  displayOrder?: number;
};

export type WebsiteBriefQaAlbum = {
  id: string;
  title: string;
  description?: string;
  category?: string;
  sourceUrl?: string;
  coverImageUrl?: string;
  photos: WebsiteBriefQaPhoto[];
  enabled: boolean;
  displayOrder: number;
};

export type WebsiteBriefQaBeforeAfterPair = {
  id: string;
  title: string;
  beforeImage: string;
  afterImage: string;
  beforeUrl?: string;
  afterUrl?: string;
  serviceCategory: string;
  category?: string;
  description: string;
  caption?: string;
  displayOrder?: number;
  enabled?: boolean;
  confidence?: 'high' | 'medium' | 'needs_review';
};

export type WebsiteBriefQaPhotosJson = {
  logo?: string;
  hero?: string;
  heroImages?: string[];
  primaryHeroImage?: string;
  heroMobile?: string;
  gallery?: string[];
  projectAlbums?: WebsiteBriefQaAlbum[];
  beforeAfterPairs?: WebsiteBriefQaBeforeAfterPair[];
  heroHotspots?: unknown[];
  colours?: { primary?: string; secondary?: string; tertiary?: string };
  generatedLogo?: { initials: string; svg: string; source: 'generated' };
  logoSource?: 'uploaded' | 'generated' | 'missing';
  suggestedBrandColours?: SuggestedBrandColours;
  photoCategories?: WebsiteBriefQaPhoto[];
  qaStatus?: 'passed' | 'review_required' | 'critical_issues';
  qaScore?: number;
  qaLastRunAt?: string;
  qaWarnings?: string[];
  qaSuggestions?: string[];
  qaChanges?: QaChange[];
  [key: string]: unknown;
};

export type WebsiteBriefQaInput = {
  businessName: string;
  brief: WebsiteBriefCore;
  reviews?: Array<{ author?: string; rating?: number; body?: string; source?: string; date?: string }>;
  photosJson?: WebsiteBriefQaPhotosJson | string | string[] | null;
};

export type SuggestedBrandColours = {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
};

export type QaChange = {
  type: 'cleaned' | 'moved' | 'generated' | 'flagged' | 'organised';
  field: string;
  summary: string;
  original?: string;
  updated?: string;
};

export type WebsiteBriefQaResult = {
  agentName: 'Website Brief QA Agent';
  brief: WebsiteBriefCore;
  photosJson: WebsiteBriefQaPhotosJson;
  seo: {
    primaryService: string;
    primaryLocation: string;
    secondaryLocations: string[];
    seoTitle: string;
    metaDescription: string;
    serviceKeywords: string[];
    imageAltText: Record<string, string>;
    projectAlbumSeoDescriptions: Record<string, string>;
    faqSuggestions: string[];
  };
  score: {
    total: number;
    categories: Record<'ContentCompleteness' | 'PhotoQuality' | 'SEOReadiness' | 'BrandingReadiness' | 'ServiceClarity' | 'ContactCompleteness' | 'GalleryOrganisation', number>;
    passed: string[];
    warnings: string[];
    criticalIssues: string[];
    suggestions: string[];
  };
  changes: QaChange[];
};

const NAV_RE = /\b(overview|skills|reviews|photos|company\s+info(?:rmation)?|view\s+services|request\s+a\s+quote|get\s+quotes|save|share|menu)\b/gi;
const REVIEW_RE = /\b(review|rated|stars?|great work|excellent|would recommend|recommend|customer)\b/i;
const SERVICE_HINT_RE = /\b(installation|repair|repairs|rewire|rewires|consumer unit|lighting|inspection|testing|plumbing|boiler|bathroom|kitchen|roof|driveway|landscaping|decorating|service|maintenance)\b/i;

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function cleanLines(text: string): string[] {
  const seen = new Set<string>();
  return text
    .split(/\r?\n|\s{2,}|•|\|/)
    .map((line) => line.replace(NAV_RE, '').replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .filter((line) => {
      const key = line.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function titleCase(input: string): string {
  return input
    .replace(/[-_]+/g, ' ')
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function inferServiceCategory(text: string, fallback = 'General Work'): string {
  const lower = text.toLowerCase();
  if (/consumer|electrical|rewire|lighting|socket|fuse/.test(lower)) return 'Electrical Work';
  if (/boiler|plumb|bathroom|leak/.test(lower)) return 'Plumbing';
  if (/roof|gutter/.test(lower)) return 'Roofing';
  if (/drive|patio|landscap|garden/.test(lower)) return 'Outdoor Projects';
  return fallback;
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'album';
}

function isGenericImportedAlbum(title: string, sourceUrl?: string): boolean {
  return /^(google photos?|photos?|gallery photos?|imported photos?|project photos?|website photos?)$/i.test(title.trim())
    || /google|maps\.google/i.test(sourceUrl ?? '');
}

function photoCategoryText(photo: WebsiteBriefQaPhoto): string {
  return [photo.filename, photo.caption, photo.alt, photo.source].filter(Boolean).join(' ');
}

function serviceLinesFromBrief(brief: WebsiteBriefCore): string[] {
  return cleanLines(asString(brief.services))
    .filter((line) => !/^location\/service area/i.test(line))
    .slice(0, 6);
}

function serviceCategoriesFromBrief(brief: WebsiteBriefCore): string[] {
  const source = cleanLines(`${asString(brief.services)}\n${asString(brief.industry)}`);
  const categories: string[] = [];
  for (const line of source) {
    const category = inferServiceCategory(line, '');
    if (category && !categories.includes(category)) categories.push(category);
  }
  return categories.slice(0, 4);
}

function parsePhotos(input: WebsiteBriefQaInput['photosJson']): WebsiteBriefQaPhotosJson {
  if (!input) return {};
  if (typeof input === 'string') {
    try { return parsePhotos(JSON.parse(input)); } catch { return {}; }
  }
  if (Array.isArray(input)) return { gallery: input, projectAlbums: [] };
  return { ...input };
}

function photoDedupeKey(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return '';
  try {
    const parsed = new URL(trimmed, 'https://local.invalid');
    if (parsed.pathname === '/api/img' && parsed.searchParams.get('url')) {
      return photoDedupeKey(decodeURIComponent(parsed.searchParams.get('url') ?? ''));
    }
    if (/googleusercontent\.com$/i.test(parsed.hostname)) {
      parsed.pathname = parsed.pathname.replace(/=w\d+-h\d+(?:-[a-z0-9-]+)?$/i, '');
      parsed.search = '';
      parsed.hash = '';
      return parsed.toString().toLowerCase();
    }
    return trimmed.toLowerCase();
  } catch {
    return trimmed.replace(/=w\d+-h\d+(?:-[a-z0-9-]+)?$/i, '').toLowerCase();
  }
}

function normalizePhoto(photo: Partial<WebsiteBriefQaPhoto> | string, index: number, albumId?: string): WebsiteBriefQaPhoto {
  const url = typeof photo === 'string' ? photo.trim() : String(photo.url ?? '').trim();
  const filename = typeof photo === 'string'
    ? decodeURIComponent(url.split('/').pop() ?? `photo-${index + 1}`)
    : asString(photo.filename) || decodeURIComponent(url.split('/').pop() ?? `photo-${index + 1}`);
  const width = typeof photo === 'object' ? Number(photo.width ?? 0) || undefined : undefined;
  const height = typeof photo === 'object' ? Number(photo.height ?? 0) || undefined : undefined;
  let orientation: WebsiteBriefQaPhoto['orientation'] = 'unknown';
  if (width && height) orientation = width > height ? 'landscape' : height > width ? 'portrait' : 'square';
  else if (/portrait|vertical/i.test(filename)) orientation = 'portrait';
  else orientation = 'landscape';
  const before = /\bbefore\b/i.test(filename);
  const after = /\b(after|completed|finished|complete)\b/i.test(filename);
  const qualityScore = (orientation === 'landscape' ? 25 : 12) + (width && height ? Math.min(45, Math.round((width * height) / 50000)) : 25) + (after ? 15 : 0) - (/blur|low|small|thumb/i.test(filename) ? 25 : 0);
  return {
    id: typeof photo === 'object' ? asString(photo.id) || `qa_photo_${index}` : `qa_photo_${index}`,
    url,
    filename,
    alt: typeof photo === 'object' ? asString(photo.alt) : '',
    caption: typeof photo === 'object' ? asString(photo.caption) : '',
    albumId,
    isBeforePhoto: before,
    isAfterPhoto: after,
    qualityScore: Math.max(0, Math.min(100, qualityScore)),
    orientation,
    width,
    height,
    source: typeof photo === 'object' ? asString(photo.source) : '',
    displayOrder: typeof photo === 'object' ? Number(photo.displayOrder ?? index) : index,
  };
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function safeSvgColour(value: unknown, fallback: string): string {
  const colour = asString(value);
  return /^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(colour) ? colour : fallback;
}

function sanitizeSuggestedColours(colours: SuggestedBrandColours): SuggestedBrandColours {
  const defaults = suggestColours('');
  return {
    primary: safeSvgColour(colours.primary, defaults.primary),
    secondary: safeSvgColour(colours.secondary, defaults.secondary),
    accent: safeSvgColour(colours.accent, defaults.accent),
    background: safeSvgColour(colours.background, defaults.background),
    text: safeSvgColour(colours.text, defaults.text),
  };
}

function makeLogo(businessName: string, industry: string, colours: SuggestedBrandColours) {
  const words = businessName.match(/[A-Za-z0-9]+/g) ?? ['RT'];
  const initials = words.slice(0, 3).map((w) => w[0]?.toUpperCase()).join('') || 'RT';
  const safeColours = sanitizeSuggestedColours(colours);
  const safeName = escapeXml(businessName);
  const safeTrade = escapeXml(titleCase(industry || 'business'));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="420" height="140" viewBox="0 0 420 140" role="img" aria-label="${safeName} logo"><rect width="420" height="140" rx="28" fill="${safeColours.primary}"/><circle cx="70" cy="70" r="42" fill="${safeColours.accent}"/><text x="70" y="82" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="34" font-weight="800" fill="${safeColours.primary}">${escapeXml(initials)}</text><text x="130" y="62" font-family="Inter,Arial,sans-serif" font-size="28" font-weight="800" fill="#ffffff">${safeName}</text><text x="132" y="92" font-family="Inter,Arial,sans-serif" font-size="16" font-weight="600" fill="${safeColours.accent}">${safeTrade} specialist</text></svg>`;
  return { initials, svg, source: 'generated' as const };
}

function suggestColours(industry: string): SuggestedBrandColours {
  const lower = industry.toLowerCase();
  if (/electrical|electric/.test(lower)) return { primary: '#0f172a', secondary: '#2563eb', accent: '#f59e0b', background: '#f8fafc', text: '#111827' };
  if (/beauty|salon|clinic/.test(lower)) return { primary: '#7c2d12', secondary: '#f3d6c6', accent: '#c084fc', background: '#fff7ed', text: '#1f2937' };
  if (/plumb|bathroom/.test(lower)) return { primary: '#0f3a5f', secondary: '#0284c7', accent: '#22c55e', background: '#f8fafc', text: '#111827' };
  return { primary: '#111827', secondary: '#2563eb', accent: '#f59e0b', background: '#ffffff', text: '#111827' };
}

export function runWebsiteBriefQaAgent(input: WebsiteBriefQaInput): WebsiteBriefQaResult {
  const changes: QaChange[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];
  const criticalIssues: string[] = [];
  const brief: WebsiteBriefCore = { ...input.brief };
  const originalAbout = asString(brief.about);
  const aboutLines = cleanLines(originalAbout);
  const movedServices = aboutLines.filter((line) => SERVICE_HINT_RE.test(line) && line.length < 80 && !REVIEW_RE.test(line));
  const aboutOnly = aboutLines.filter((line) => !movedServices.includes(line) && !REVIEW_RE.test(line));
  const existingServices = cleanLines(asString(brief.services));

  if (movedServices.length > 0) {
    brief.aboutOriginal = originalAbout;
    brief.services = [...existingServices, ...movedServices].filter((v, i, a) => a.findIndex((x) => x.toLowerCase() === v.toLowerCase()) === i).join('\n');
    changes.push({ type: 'moved', field: 'services', summary: 'Moved service-like lines out of About into Services.', original: originalAbout, updated: brief.services });
  } else if (existingServices.length > 0) {
    brief.services = existingServices.join('\n');
  }

  if (originalAbout) {
    const cleanedAbout = aboutOnly.join('\n\n');
    if (cleanedAbout && cleanedAbout !== originalAbout) {
      brief.aboutOriginal = originalAbout;
      brief.about = cleanedAbout;
      changes.push({ type: 'cleaned', field: 'about', summary: 'Removed copied navigation/review noise and shortened paragraphs.', original: originalAbout, updated: cleanedAbout });
    }
  }

  if (!asString(brief.about)) {
    const svc = cleanLines(asString(brief.services)).slice(0, 3).join(', ').toLowerCase() || 'professional services';
    brief.about = `${input.businessName} provides ${svc}${brief.city ? ` across ${brief.city}` : ''}. The business focuses on clear communication, reliable workmanship and a professional service from enquiry through to completion.`;
    changes.push({ type: 'generated', field: 'about', summary: 'Generated an editable About section from verified brief fields.' });
  }

  if (brief.accreditations) {
    const acc = cleanLines(asString(brief.accreditations)).join('\n');
    if (acc !== brief.accreditations) {
      changes.push({ type: 'cleaned', field: 'accreditations', summary: 'Removed duplicate accreditation entries.', original: asString(brief.accreditations), updated: acc });
      brief.accreditations = acc;
    }
  }

  const photosJson = parsePhotos(input.photosJson);
  const allPhotos: WebsiteBriefQaPhoto[] = [];
  const seenPhotoKeys = new Set<string>();
  const duplicateUrls = new Set<string>();
  let duplicateCount = 0;
  const keepUniquePhoto = (photo: WebsiteBriefQaPhoto): WebsiteBriefQaPhoto | null => {
    const key = photoDedupeKey(photo.url);
    if (!key) return null;
    if (seenPhotoKeys.has(key)) {
      duplicateUrls.add(photo.url);
      duplicateCount += 1;
      return null;
    }
    seenPhotoKeys.add(key);
    allPhotos.push(photo);
    return photo;
  };

  let albums: WebsiteBriefQaAlbum[] = (Array.isArray(photosJson.projectAlbums) ? photosJson.projectAlbums : []).map((album, albumIndex) => {
    const photos = (album.photos ?? [])
      .map((photo, i) => normalizePhoto(photo, allPhotos.length + i, album.id))
      .map(keepUniquePhoto)
      .filter((photo): photo is WebsiteBriefQaPhoto => Boolean(photo));
    const title = album.title?.trim() || titleCase(photos[0]?.filename ?? `Project Album ${albumIndex + 1}`);
    const category = album.category?.trim() || inferServiceCategory(`${title} ${photos.map((p) => p.filename).join(' ')}`);
    const cover = photos.some((photo) => photo.url === album.coverImageUrl)
      ? album.coverImageUrl
      : [...photos].sort((a, b) => (b.qualityScore ?? 0) - (a.qualityScore ?? 0))[0]?.url || '';
    return { ...album, title, category, coverImageUrl: cover, description: album.description || `${title} project completed for a local customer.`, photos, enabled: album.enabled !== false, displayOrder: album.displayOrder ?? albumIndex };
  }).filter((album) => album.photos.length > 0);

  for (const [i, url] of (photosJson.gallery ?? []).entries()) {
    keepUniquePhoto(normalizePhoto(url, allPhotos.length + i));
  }

  if (duplicateCount > 0) {
    warnings.push(`Duplicate photo URLs removed: ${duplicateCount} duplicate entr${duplicateCount === 1 ? 'y' : 'ies'} across ${duplicateUrls.size} URL${duplicateUrls.size === 1 ? '' : 's'}.`);
    changes.push({ type: 'cleaned', field: 'photos', summary: `Removed ${duplicateCount} duplicate photo URL${duplicateCount === 1 ? '' : 's'} from albums/gallery before QA organisation.` });
  }

  const briefServiceCategories = serviceCategoriesFromBrief(brief);
  const briefServiceLines = serviceLinesFromBrief(brief);
  const splitAlbums: WebsiteBriefQaAlbum[] = [];
  let splitCount = 0;
  for (const album of albums) {
    const isGeneric = isGenericImportedAlbum(album.title, album.sourceUrl);
    const groups = new Map<string, WebsiteBriefQaPhoto[]>();
    for (const photo of album.photos) {
      const category = inferServiceCategory(photoCategoryText(photo));
      const key = category === 'General Work' ? album.title : category;
      const group = groups.get(key) ?? [];
      group.push(photo);
      groups.set(key, group);
    }

    if (isGeneric && groups.size <= 1 && briefServiceCategories.length > 1 && album.photos.length >= briefServiceCategories.length) {
      groups.clear();
      album.photos.forEach((photo, i) => {
        const category = briefServiceCategories[i % briefServiceCategories.length];
        const group = groups.get(category) ?? [];
        group.push(photo);
        groups.set(category, group);
      });
    } else if (isGeneric && groups.size <= 1 && briefServiceLines.length > 1 && album.photos.length >= briefServiceLines.length) {
      groups.clear();
      album.photos.forEach((photo, i) => {
        const serviceLine = titleCase(briefServiceLines[i % briefServiceLines.length]);
        const group = groups.get(serviceLine) ?? [];
        group.push(photo);
        groups.set(serviceLine, group);
      });
    }

    const shouldSplit = isGeneric && groups.size > 1;
    if (!shouldSplit) {
      splitAlbums.push(album);
      continue;
    }

    splitCount += groups.size;
    let groupIndex = 0;
    for (const [category, photos] of groups.entries()) {
      const id = `${album.id}_${slugify(category)}`;
      for (const [photoIndex, photo] of photos.entries()) {
        photo.albumId = id;
        photo.displayOrder = photoIndex;
      }
      const cover = [...photos].sort((a, b) => (b.qualityScore ?? 0) - (a.qualityScore ?? 0))[0]?.url || '';
      splitAlbums.push({
        ...album,
        id,
        title: category === 'General Work' ? `${album.title} ${groupIndex + 1}` : `${category} Photos`,
        category,
        coverImageUrl: cover,
        description: `${category} photos organised from ${album.title}.`,
        photos,
        displayOrder: splitAlbums.length,
      });
      groupIndex += 1;
    }
  }
  if (splitCount > 0) {
    albums = splitAlbums;
    changes.push({ type: 'organised', field: 'projectAlbums', summary: `Split mixed imported photos into ${splitCount} service-specific albums so templates can spread images across the website.` });
  }

  const pairs: WebsiteBriefQaBeforeAfterPair[] = (Array.isArray(photosJson.beforeAfterPairs) ? photosJson.beforeAfterPairs : [])
    .filter((pair) => pair && (pair.beforeUrl || pair.beforeImage) && (pair.afterUrl || pair.afterImage))
    .map((pair, index) => ({
      ...pair,
      id: pair.id || `manual_ba_${index + 1}`,
      title: pair.title || `Before & After ${index + 1}`,
      beforeImage: pair.beforeImage || pair.beforeUrl || '',
      afterImage: pair.afterImage || pair.afterUrl || '',
      beforeUrl: pair.beforeUrl || pair.beforeImage || '',
      afterUrl: pair.afterUrl || pair.afterImage || '',
      serviceCategory: pair.serviceCategory || pair.category || 'General Work',
      category: pair.category || pair.serviceCategory || 'General Work',
      description: pair.description || pair.caption || 'Before and after comparison.',
      caption: pair.caption || pair.description || '',
      displayOrder: pair.displayOrder ?? index,
      enabled: pair.enabled !== false,
    }));
  const befores = allPhotos.filter((p) => p.isBeforePhoto);
  const afters = allPhotos.filter((p) => p.isAfterPhoto);
  for (const before of befores) {
    const stem = (before.filename ?? '').toLowerCase().replace(/before|after|completed|finished|complete|[-_\s]+/g, '');
    const after = afters.find((candidate) => candidate.albumId === before.albumId && (candidate.filename ?? '').toLowerCase().replace(/before|after|completed|finished|complete|[-_\s]+/g, '') === stem) ?? afters.find((candidate) => candidate.albumId === before.albumId) ?? afters[0];
    if (after && !pairs.some((pair) => (pair.beforeUrl || pair.beforeImage) === before.url && (pair.afterUrl || pair.afterImage) === after.url)) {
      const id = `qa_ba_${pairs.length + 1}`;
      const category = inferServiceCategory(`${before.filename} ${after.filename}`);
      pairs.push({ id, title: titleCase((after.filename ?? before.filename ?? 'Before After').replace(/after|before/ig, '')), beforeImage: before.url, afterImage: after.url, beforeUrl: before.url, afterUrl: after.url, serviceCategory: category, category, description: `${category} before and after comparison.`, caption: `${category} transformation`, displayOrder: pairs.length, enabled: true, confidence: before.albumId === after.albumId ? 'high' : 'needs_review' });
      before.beforeAfterPairId = id;
      after.beforeAfterPairId = id;
    }
  }
  if (befores.length > 0 && pairs.length === 0) warnings.push('Possible before photos found but no confident after match; needs review.');

  const rankedPhotos = [...allPhotos].sort((a, b) => {
    const aAfter = a.isAfterPhoto ? 15 : 0;
    const bAfter = b.isAfterPhoto ? 15 : 0;
    return ((b.qualityScore ?? 0) + bAfter) - ((a.qualityScore ?? 0) + aAfter);
  });
  const heroCandidates = rankedPhotos.filter((photo) => photo.orientation === 'landscape' && (photo.qualityScore ?? 0) >= 40).slice(0, 5);
  heroCandidates.forEach((photo) => { photo.isHeroCandidate = true; });

  for (const photo of allPhotos) {
    if (photo.isBeforePhoto) photo.category = 'Before Photos';
    else if (photo.isAfterPhoto) photo.category = 'After Photos';
    else if (photo.isHeroCandidate) photo.category = 'Hero Images';
    else if ((photo.qualityScore ?? 0) < 35) photo.category = 'Poor Quality / Needs Review';
    else if (photo.albumId) photo.category = 'Project Album';
    else photo.category = 'Gallery Photos';
    if (!photo.alt) photo.alt = `${input.businessName} ${titleCase(photo.filename ?? 'project photo')}`;
  }

  if (heroCandidates.length === 0 && allPhotos.length > 0) warnings.push('No strong landscape hero image found; review hero choice manually.');
  const suggestedBrandColours = sanitizeSuggestedColours(photosJson.suggestedBrandColours ?? suggestColours(asString(brief.industry)));
  const hasUploadedLogo = Boolean(asString(photosJson.logo));
  if (!hasUploadedLogo) {
    photosJson.generatedLogo = makeLogo(input.businessName, asString(brief.industry), suggestedBrandColours);
    photosJson.logoSource = 'generated';
    warnings.push('Logo is missing, generated placeholder added for review.');
    changes.push({ type: 'generated', field: 'generatedLogo', summary: 'Created an editable SVG placeholder logo from business initials and brand colours.' });
  } else {
    photosJson.logoSource = 'uploaded';
  }

  const services = cleanLines(asString(brief.services));
  if (services.length === 0) criticalIssues.push('No services are listed. Add core services before generating the website.');
  const primaryService = services[0] ?? titleCase(asString(brief.industry) || 'Service');
  const primaryLocation = asString(brief.city) || asString(brief.postcode) || '';
  const seo = {
    primaryService,
    primaryLocation,
    secondaryLocations: [],
    seoTitle: `${input.businessName}${primaryService ? ` | ${primaryService}` : ''}${primaryLocation ? ` in ${primaryLocation}` : ''}`.slice(0, 65),
    metaDescription: `${input.businessName} provides ${primaryService.toLowerCase()}${primaryLocation ? ` in ${primaryLocation}` : ''}. Contact the team for a professional, reliable service.`.slice(0, 155),
    serviceKeywords: services.slice(0, 8).map((s) => primaryLocation ? `${s} ${primaryLocation}` : s),
    imageAltText: Object.fromEntries(allPhotos.map((p) => [p.url, p.alt ?? `${input.businessName} project photo`])),
    projectAlbumSeoDescriptions: Object.fromEntries(albums.map((a) => [a.id, `${a.title} by ${input.businessName}${primaryLocation ? ` in ${primaryLocation}` : ''}.`])),
    faqSuggestions: [
      `What areas do ${input.businessName} cover?`,
      `What services do ${input.businessName} provide?`,
      'How quickly can I request a quote?',
      'Are you insured and qualified?',
      'Can I see examples of completed work?',
      'Do you offer free advice before booking?',
    ],
  };

  if (!asString(brief.phone) && !asString(brief.email)) criticalIssues.push('No phone number or email address is present.');
  if (!asString(brief.openingHours)) suggestions.push('Add opening hours so the website can show clear availability.');
  if (allPhotos.some((p) => (p.qualityScore ?? 0) < 35)) warnings.push('Some project photos are low quality or need manual review.');

  const categories = {
    ContentCompleteness: Math.min(100, (asString(brief.about) ? 40 : 0) + (services.length ? 40 : 0) + (asString(brief.accreditations) ? 20 : 10)),
    PhotoQuality: allPhotos.length === 0 ? 30 : Math.round(allPhotos.reduce((sum, p) => sum + (p.qualityScore ?? 50), 0) / allPhotos.length),
    SEOReadiness: Math.min(100, (primaryService ? 35 : 0) + (primaryLocation ? 35 : 0) + (seo.metaDescription ? 30 : 0)),
    BrandingReadiness: hasUploadedLogo ? 100 : 80,
    ServiceClarity: Math.min(100, services.length * 20 + (services.some((s) => s.length > 24) ? 20 : 0)),
    ContactCompleteness: Math.min(100, (asString(brief.phone) ? 35 : 0) + (asString(brief.email) ? 35 : 0) + (primaryLocation ? 30 : 0)),
    GalleryOrganisation: Math.min(100, (albums.length ? 45 : 0) + (heroCandidates.length ? 30 : 0) + (pairs.length ? 25 : 10)),
  };
  const total = Math.round(Object.values(categories).reduce((a, b) => a + b, 0) / Object.values(categories).length);
  const passed = Object.entries(categories).filter(([, score]) => score >= 75).map(([name]) => name.replace(/([A-Z])/g, ' $1').trim());

  photosJson.projectAlbums = albums;
  photosJson.gallery = allPhotos.map((photo) => photo.url);
  photosJson.beforeAfterPairs = pairs.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  photosJson.photoCategories = allPhotos;
  const existingHeroImages = [...(photosJson.heroImages ?? []), photosJson.hero ?? ''].filter(Boolean);
  const heroSeen = new Set<string>();
  const effectiveHeroImages = [...existingHeroImages, ...heroCandidates.map((photo) => photo.url)]
    .filter((url) => {
      const key = photoDedupeKey(url);
      if (!key || heroSeen.has(key)) return false;
      heroSeen.add(key);
      return true;
    })
    .slice(0, 5);
  photosJson.primaryHeroImage = effectiveHeroImages[0] ?? '';
  photosJson.heroImages = effectiveHeroImages;
  photosJson.hero = photosJson.primaryHeroImage;
  photosJson.suggestedBrandColours = suggestedBrandColours;
  photosJson.qaScore = total;
  photosJson.qaStatus = criticalIssues.length > 0 ? 'critical_issues' : warnings.length > 0 ? 'review_required' : 'passed';
  photosJson.qaLastRunAt = new Date().toISOString();
  photosJson.qaWarnings = warnings;
  photosJson.qaSuggestions = suggestions;

  if (albums.length > 0 || allPhotos.length > 0) changes.push({ type: 'organised', field: 'photos', summary: 'Categorised photos, selected hero candidates and built project album metadata.' });
  if (pairs.length > 0) changes.push({ type: 'organised', field: 'beforeAfterPairs', summary: 'Detected before/after photo pairs from filenames and album grouping.' });
  changes.push({ type: 'generated', field: 'seo', summary: 'Generated editable local SEO title, meta description, keywords, alt text and FAQs.' });
  photosJson.qaChanges = changes;

  return {
    agentName: 'Website Brief QA Agent',
    brief,
    photosJson,
    seo,
    changes,
    score: { total, categories, passed, warnings, criticalIssues, suggestions },
  };
}
