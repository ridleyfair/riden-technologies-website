import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildGoogleBusinessBriefPatch,
  mergeBriefPatchPreservingEdits,
  mergeGoogleBusinessPatchAndRunQa,
} from '../src/lib/google-business-brief';

const googleItem = {
  title: 'Kenley Plumbers',
  phone: '+44 20 0000 0000',
  city: 'London',
  postalCode: 'CR8 5AA',
  categoryName: 'Plumber',
  categories: ['Plumber', 'Bathroom plumbing'],
  description: 'Family-run plumbers helping with leaks, boilers and bathroom plumbing across Kenley.',
  totalScore: 4.8,
  reviewsCount: 18,
  url: 'https://www.google.com/maps/place/Kenley+Plumbers',
  reviews: [
    { name: 'Sarah T', stars: 5, text: 'Fast and tidy repair for a bathroom leak.', publishedAtDate: '2026-01-01' },
    { author: 'Mo K', rating: 4, body: 'Helpful plumber and clear pricing.', date: '2026-01-02' },
  ],
  imageUrl: 'https://example.test/hero.jpg',
  imageUrls: [
    { imageUrl: 'https://example.test/job-1.jpg' },
    'https://example.test/job-2.jpg',
  ],
  openingHours: [{ day: 'Monday', hours: '08:00-18:00' }],
  reviewsTags: [{ title: 'leak repair', count: 7 }],
};

test('buildGoogleBusinessBriefPatch converts Google Business scrape output into saved website brief fields', () => {
  const patch = buildGoogleBusinessBriefPatch(googleItem, { projectName: 'Kenley Plumbers Website Build' });

  assert.equal(patch.phone, '+44 20 0000 0000');
  assert.equal(patch.city, 'London');
  assert.equal(patch.postcode, 'CR8 5AA');
  assert.match(patch.about ?? '', /Family-run plumbers/i);
  assert.match(patch.services ?? '', /leak repair/i);
  assert.match(patch.openingHours ?? '', /Monday: 08:00-18:00/);

  const reviews = JSON.parse(patch.reviewsJson ?? '[]');
  assert.equal(reviews.length, 2);
  assert.equal(reviews[0].source, 'google');
  assert.match(reviews[0].body, /bathroom leak/i);

  const photos = JSON.parse(patch.photosJson ?? '{}');
  assert.equal(photos.heroImages[0], 'https://example.test/hero.jpg');
  assert.equal(photos.projectAlbums[0].title, 'Google Photos');
  assert.equal(photos.projectAlbums[0].photos.length, 3);
  assert.equal(photos.reviewSettings.platform, 'Google');
  assert.equal(photos.reviewSettings.reviewCount, 18);
  assert.equal(photos.reviewSettings.platformUrl, googleItem.url);
});

test('mergeBriefPatchPreservingEdits does not overwrite human edited fields but fills blank media/review fields', () => {
  const patch = buildGoogleBusinessBriefPatch(googleItem);
  const merged = mergeBriefPatchPreservingEdits({
    existing: {
      about: 'MANUAL TEST EDIT — DO NOT OVERWRITE',
      services: 'Manual services',
      phone: '',
      reviewsJson: '[]',
      photosJson: '{}',
    },
    patch,
  });

  assert.equal(merged.about, 'MANUAL TEST EDIT — DO NOT OVERWRITE');
  assert.equal(merged.services, 'Manual services');
  assert.equal(merged.phone, '+44 20 0000 0000');
  assert.notEqual(merged.reviewsJson, '[]');
  assert.notEqual(merged.photosJson, '{}');
});

test('mergeBriefPatchPreservingEdits upgrades machine-prefilled plain-array photosJson to rich Google photosJson without losing existing photos', () => {
  const patch = buildGoogleBusinessBriefPatch(googleItem, { projectName: 'Kenley Plumbers' });
  const merged = mergeBriefPatchPreservingEdits({
    existing: {
      // Plain array = machine prefill from possible-client import, NOT a human edit
      photosJson: JSON.stringify(['https://example.test/prefill-1.jpg', 'https://example.test/job-2.jpg']),
      about: '',
      services: '',
      reviewsJson: '[]',
    },
    patch,
  });

  const photos = JSON.parse(merged.photosJson ?? '{}');
  // Rich structure must win
  assert.equal(photos.reviewSettings.platform, 'Google');
  assert.ok(Array.isArray(photos.gallery));
  assert.ok(Array.isArray(photos.projectAlbums));
  // Existing prefill photo not in the Google patch must be folded into the gallery
  assert.ok(photos.gallery.includes('https://example.test/prefill-1.jpg'));
  // No duplicates for URLs present in both
  assert.equal(photos.gallery.filter((u: string) => u === 'https://example.test/job-2.jpg').length, 1);
});

test('mergeBriefPatchPreservingEdits keeps a rich human-edited photosJson object untouched', () => {
  const patch = buildGoogleBusinessBriefPatch(googleItem);
  const humanPhotos = JSON.stringify({
    logo: 'https://example.test/logo.png',
    heroImages: ['https://example.test/custom-hero.jpg'],
    gallery: ['https://example.test/custom-1.jpg'],
    projectAlbums: [],
    reviewSettings: { platform: 'Trustpilot' },
  });
  const merged = mergeBriefPatchPreservingEdits({
    existing: { photosJson: humanPhotos },
    patch,
  });
  assert.equal(merged.photosJson, humanPhotos);
});

test('mergeGoogleBusinessPatchAndRunQa automatically adds Website Brief QA output after Google import', () => {
  const patch = buildGoogleBusinessBriefPatch(googleItem, { projectName: 'Kenley Plumbers' });
  const merged = mergeGoogleBusinessPatchAndRunQa({
    businessName: 'Kenley Plumbers',
    existing: {
      about: '',
      services: '',
      reviewsJson: '[]',
      photosJson: '{}',
      city: '',
      phone: '',
    },
    patch,
  });

  const photos = JSON.parse(merged.photosJson ?? '{}');
  assert.ok(photos.qaLastRunAt, 'QA last-run timestamp should be present');
  assert.ok(['passed', 'review_required', 'critical_issues'].includes(photos.qaStatus));
  assert.equal(typeof photos.qaScore, 'number');
  assert.ok(Array.isArray(photos.qaWarnings));
  assert.ok(Array.isArray(photos.qaSuggestions));
  assert.ok(Array.isArray(photos.photoCategories));
  assert.ok(photos.primaryHeroImage, 'QA should select or preserve a primary hero image');
  assert.match(merged.about ?? '', /Family-run plumbers/i);
});

test('mergeGoogleBusinessPatchAndRunQa can replace machine-prefilled possible-client placeholders during first import', () => {
  const patch = buildGoogleBusinessBriefPatch(googleItem, { projectName: 'Kenley Plumbers' });
  const merged = mergeGoogleBusinessPatchAndRunQa({
    businessName: 'Kenley Plumbers',
    existing: {
      source: 'possible_client_import',
      notes: 'Auto-created from Possible Client import.\nBrief fields were prefilled from scraped business data. Review before publishing or sending to a prospect.',
      about: 'Kenley Plumbers is a plumber based in London. This placeholder came from lead discovery.',
      services: 'Plumber',
      openingHours: '',
      reviewsJson: '[]',
      photosJson: JSON.stringify(['https://example.test/prefill-1.jpg']),
      city: 'London',
      phone: '+44 20 0000 0000',
    },
    patch,
    preserveMachinePrefill: false,
  });

  assert.match(merged.about ?? '', /Family-run plumbers helping with leaks/i);
  assert.match(merged.services ?? '', /leak repair/i);
  assert.match(merged.openingHours ?? '', /Monday: 08:00-18:00/);

  const photos = JSON.parse(merged.photosJson ?? '{}');
  assert.ok(photos.gallery.includes('https://example.test/prefill-1.jpg'), 'Machine-prefilled photos should be retained during Google enrichment');
});
