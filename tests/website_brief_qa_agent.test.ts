import test from 'node:test';
import assert from 'node:assert/strict';
import {
  runWebsiteBriefQaAgent,
  type WebsiteBriefQaInput,
} from '../src/lib/website-brief-qa-agent';

const baseInput: WebsiteBriefQaInput = {
  businessName: 'S H Electrical',
  brief: {
    phone: '020 0000 0000',
    email: 'hello@shelectrical.test',
    city: 'Croydon',
    postcode: 'CR0 1AA',
    industry: 'electrical',
    services: '',
    about: 'Overview\nSkills\nConsumer unit installation\nRewires\nReviews\nGreat work from Sarah.\nS H Electrical has 12 years experience serving Croydon homes.',
    accreditations: 'NICEIC\nNICEIC',
    openingHours: '',
    socialFacebook: '',
    socialInstagram: '',
  },
  reviews: [],
  photosJson: {
    logo: '',
    heroImages: [],
    gallery: ['https://cdn.test/job-before.jpg', 'https://cdn.test/job-after.jpg', 'https://cdn.test/job-after.jpg'],
    projectAlbums: [
      {
        id: 'album_checkatrade_1',
        title: 'Checkatrade Consumer Units',
        description: '',
        category: '',
        sourceUrl: 'https://www.checkatrade.com/trades/shelectrical',
        coverImageUrl: '',
        enabled: true,
        displayOrder: 0,
        photos: [
          { id: 'p1', url: 'https://cdn.test/job-before.jpg', filename: 'kitchen-before.jpg', alt: '', caption: '', displayOrder: 0, width: 1600, height: 900, source: 'checkatrade' },
          { id: 'p2', url: 'https://cdn.test/job-after.jpg', filename: 'kitchen-after.jpg', alt: '', caption: '', displayOrder: 1, width: 1600, height: 900, source: 'checkatrade' },
        ],
      },
    ],
    colours: { primary: '', secondary: '', tertiary: '' },
  },
};

test('Website Brief QA Agent cleans content without overwriting original manual text', () => {
  const result = runWebsiteBriefQaAgent(baseInput);

  assert.equal(result.agentName, 'Website Brief QA Agent');
  assert.equal(result.brief.aboutOriginal, baseInput.brief.about);
  assert.match(String(result.brief.services), /Consumer unit installation/);
  assert.match(String(result.brief.services), /Rewires/);
  assert.doesNotMatch(String(result.brief.about), /Overview|Skills|Reviews/);
  assert.equal(result.photosJson.qaStatus, 'review_required');
  assert.ok(result.changes.some((change) => change.type === 'moved' && change.field === 'services'));
});

test('Website Brief QA Agent organises photos, flags duplicates, preserves Checkatrade albums, and creates before/after pairs', () => {
  const result = runWebsiteBriefQaAgent(baseInput);
  const photos = result.photosJson;

  assert.equal(photos.projectAlbums![0].title, 'Checkatrade Consumer Units');
  assert.equal(photos.projectAlbums![0].sourceUrl, 'https://www.checkatrade.com/trades/shelectrical');
  assert.equal(photos.primaryHeroImage, 'https://cdn.test/job-after.jpg');
  assert.deepEqual(photos.heroImages, ['https://cdn.test/job-after.jpg', 'https://cdn.test/job-before.jpg']);
  assert.equal(photos.beforeAfterPairs!.length, 1);
  assert.equal(photos.beforeAfterPairs![0].beforeImage, 'https://cdn.test/job-before.jpg');
  assert.equal(photos.beforeAfterPairs![0].afterImage, 'https://cdn.test/job-after.jpg');
  assert.ok(photos.qaWarnings!.some((warning: string) => /Duplicate photo/i.test(warning)));
  const afterPhoto = photos.photoCategories!.find((photo) => photo.url === 'https://cdn.test/job-after.jpg');
  assert.equal(afterPhoto?.isAfterPhoto, true);
  assert.equal(afterPhoto?.category, 'After Photos');
});

test('Website Brief QA Agent removes duplicate photos across albums, gallery, heroes and QA categories', () => {
  const result = runWebsiteBriefQaAgent({
    ...baseInput,
    photosJson: {
      ...baseInput.photosJson as Record<string, unknown>,
      heroImages: ['https://cdn.test/dupe-after.jpg', 'https://cdn.test/dupe-after.jpg'],
      gallery: [
        'https://cdn.test/dupe-before.jpg',
        'https://cdn.test/dupe-after.jpg',
        'https://cdn.test/dupe-after.jpg',
        'https://cdn.test/unique-gallery.jpg',
      ],
      projectAlbums: [
        {
          id: 'album_1',
          title: 'Album One',
          description: '',
          category: '',
          sourceUrl: '',
          coverImageUrl: 'https://cdn.test/dupe-after.jpg',
          enabled: true,
          displayOrder: 0,
          photos: [
            { id: 'p1', url: 'https://cdn.test/dupe-before.jpg', filename: 'dupe-before.jpg', alt: '', caption: '', displayOrder: 0, width: 1600, height: 900 },
            { id: 'p2', url: 'https://cdn.test/dupe-after.jpg', filename: 'dupe-after.jpg', alt: '', caption: '', displayOrder: 1, width: 1600, height: 900 },
            { id: 'p3', url: 'https://cdn.test/dupe-after.jpg', filename: 'dupe-after-copy.jpg', alt: '', caption: '', displayOrder: 2, width: 1600, height: 900 },
          ],
        },
        {
          id: 'album_2',
          title: 'Album Two',
          description: '',
          category: '',
          sourceUrl: '',
          coverImageUrl: '',
          enabled: true,
          displayOrder: 1,
          photos: [
            { id: 'p4', url: 'https://cdn.test/dupe-after.jpg', filename: 'dupe-after-again.jpg', alt: '', caption: '', displayOrder: 0, width: 1600, height: 900 },
            { id: 'p5', url: 'https://cdn.test/unique-album.jpg', filename: 'unique-album.jpg', alt: '', caption: '', displayOrder: 1, width: 1600, height: 900 },
          ],
        },
      ],
    },
  });

  const albumUrls = result.photosJson.projectAlbums!.flatMap((album) => album.photos.map((photo) => photo.url));
  const categoryUrls = result.photosJson.photoCategories!.map((photo) => photo.url);
  const galleryUrls = result.photosJson.gallery!;
  const heroUrls = result.photosJson.heroImages!;

  for (const urls of [albumUrls, categoryUrls, galleryUrls, heroUrls]) {
    assert.equal(new Set(urls).size, urls.length, `Expected unique URLs but got ${urls.join(', ')}`);
  }
  assert.equal(albumUrls.filter((url) => url === 'https://cdn.test/dupe-after.jpg').length, 1);
  assert.equal(categoryUrls.filter((url) => url === 'https://cdn.test/dupe-after.jpg').length, 1);
  assert.ok(result.photosJson.qaWarnings!.some((warning: string) => /Duplicate photo/i.test(warning)));
  assert.ok(result.photosJson.qaChanges!.some((change) => change.type === 'cleaned' && change.field === 'photos'));
});

test('Website Brief QA Agent treats Google image size variants as the same photo before splitting albums', () => {
  const baseGooglePhoto = 'https://lh3.googleusercontent.com/gps-cs-s/APNQkAH83pBDmCSRs71Lv5JSDXARfvc1BF1zV55yqWNvXdHs1LLlsBEYWkGf4k4U9Lx-ukH-EXDh9Ym2W9cMMzvmgPDNMuSacW-MTbg5HHxAyaYE9WBjw2MAr870UmsKKq9SLM_YCgsUcw';
  const result = runWebsiteBriefQaAgent({
    ...baseInput,
    brief: {
      ...baseInput.brief,
      services: 'Electrical services\nRepairs and fault finding\nInstallations',
    },
    photosJson: {
      logo: '',
      heroImages: [`${baseGooglePhoto}=w408-h306-k-no`],
      gallery: [
        `${baseGooglePhoto}=w408-h306-k-no`,
        `${baseGooglePhoto}=w1920-h1080-k-no`,
        'https://lh3.googleusercontent.com/gps-cs-s/APNQkAFOdJHau1neGsFkOeIHjlOw8vShCqiptaKbpFoFlpOfKVpZdCPqmOlwkHZsMsmoHQ9YTN3PHXH9SIyUyRqs4qiLW0Sq2vq6cPQMsjyxQa47huf4gcTDMHz00vvYGb8B4sMabQ6YMg=w1920-h1080-k-no',
        'https://lh3.googleusercontent.com/gps-cs-s/APNQkAExdHoy8girZuqAKcKZQtKsjFxQ6KtcQWwWPemqpv5bgQGHeZpqSAeEQGqOUZdHpVFAVXgTeA30y9DAr7Wd7nwp0Vsq_7qi4AtgPVB3Vb690mpd-hdxL0OPbxbb97VXEMuD8oO4b4tVTqE4=w1920-h1080-k-no',
      ],
      projectAlbums: [
        {
          id: 'google_photos',
          title: 'Google Photos',
          description: 'Imported from Google Business Profile.',
          category: '',
          sourceUrl: 'https://www.google.com/maps/place/example',
          coverImageUrl: `${baseGooglePhoto}=w408-h306-k-no`,
          enabled: true,
          displayOrder: 0,
          photos: [
            { id: 'g1', url: `${baseGooglePhoto}=w408-h306-k-no`, alt: 'Example photo 1', caption: '', displayOrder: 0 },
            { id: 'g2', url: `${baseGooglePhoto}=w1920-h1080-k-no`, alt: 'Example photo 1 large', caption: '', displayOrder: 1 },
            { id: 'g3', url: 'https://lh3.googleusercontent.com/gps-cs-s/APNQkAFOdJHau1neGsFkOeIHjlOw8vShCqiptaKbpFoFlpOfKVpZdCPqmOlwkHZsMsmoHQ9YTN3PHXH9SIyUyRqs4qiLW0Sq2vq6cPQMsjyxQa47huf4gcTDMHz00vvYGb8B4sMabQ6YMg=w1920-h1080-k-no', alt: 'Example photo 2', caption: '', displayOrder: 2 },
            { id: 'g4', url: 'https://lh3.googleusercontent.com/gps-cs-s/APNQkAExdHoy8girZuqAKcKZQtKsjFxQ6KtcQWwWPemqpv5bgQGHeZpqSAeEQGqOUZdHpVFAVXgTeA30y9DAr7Wd7nwp0Vsq_7qi4AtgPVB3Vb690mpd-hdxL0OPbxbb97VXEMuD8oO4b4tVTqE4=w1920-h1080-k-no', alt: 'Example photo 3', caption: '', displayOrder: 3 },
          ],
        },
      ],
      colours: { primary: '', secondary: '', tertiary: '' },
    },
  });

  const albumUrls = result.photosJson.projectAlbums!.flatMap((album) => album.photos.map((photo) => photo.url));
  const canonical = albumUrls.map((url) => url.replace(/=w\d+-h\d+(?:-[a-z-]+)?$/i, ''));
  assert.equal(new Set(canonical).size, canonical.length, `Expected Google variants to be unique across albums but got ${albumUrls.join(', ')}`);
  assert.ok(result.photosJson.qaWarnings!.some((warning: string) => /Duplicate photo/i.test(warning)));
});

test('Website Brief QA Agent splits a mixed imported photo album into service-specific albums', () => {
  const result = runWebsiteBriefQaAgent({
    ...baseInput,
    brief: {
      ...baseInput.brief,
      industry: 'home improvements',
      services: 'Bathroom plumbing\nRoof repairs\nGarden landscaping',
    },
    photosJson: {
      logo: '',
      heroImages: [],
      gallery: [],
      projectAlbums: [
        {
          id: 'google_photos',
          title: 'Google Photos',
          description: 'Imported from Google.',
          category: '',
          sourceUrl: 'https://maps.google.com/example',
          coverImageUrl: '',
          enabled: true,
          displayOrder: 0,
          photos: [
            { id: 'g1', url: 'https://cdn.test/bathroom-before.jpg', filename: 'bathroom-before.jpg', caption: 'Bathroom first fix before', displayOrder: 0, width: 1600, height: 900, source: 'google' },
            { id: 'g2', url: 'https://cdn.test/bathroom-after.jpg', filename: 'bathroom-after.jpg', caption: 'Finished bathroom plumbing', displayOrder: 1, width: 1600, height: 900, source: 'google' },
            { id: 'g3', url: 'https://cdn.test/roof-repair.jpg', filename: 'roof-repair.jpg', caption: 'Roof repair and gutter work', displayOrder: 2, width: 1600, height: 900, source: 'google' },
            { id: 'g4', url: 'https://cdn.test/garden-patio.jpg', filename: 'garden-patio.jpg', caption: 'Garden patio landscaping', displayOrder: 3, width: 1600, height: 900, source: 'google' },
          ],
        },
      ],
      colours: { primary: '', secondary: '', tertiary: '' },
    },
  });

  const albums = result.photosJson.projectAlbums ?? [];
  const titles = albums.map((album) => album.title);

  assert.ok(albums.length >= 3, `Expected service-specific albums, got ${titles.join(', ')}`);
  assert.ok(titles.some((title) => /Plumbing/i.test(title)), `Missing plumbing album in ${titles.join(', ')}`);
  assert.ok(titles.some((title) => /Roofing/i.test(title)), `Missing roofing album in ${titles.join(', ')}`);
  assert.ok(titles.some((title) => /Outdoor/i.test(title)), `Missing outdoor album in ${titles.join(', ')}`);
  assert.ok(!albums.some((album) => album.title === 'Google Photos' && album.photos.length === 4), 'Mixed Google Photos album should not remain as one large album');
  assert.ok(result.photosJson.qaChanges!.some((change) => change.type === 'organised' && change.field === 'projectAlbums'));
});

test('Website Brief QA Agent distributes opaque Google photos across service albums when photos have no useful captions', () => {
  const result = runWebsiteBriefQaAgent({
    ...baseInput,
    brief: {
      ...baseInput.brief,
      industry: 'plumbing and roofing',
      services: 'Bathroom plumbing\nRoof repairs\nGarden landscaping',
    },
    photosJson: {
      logo: '',
      heroImages: ['https://lh3.googleusercontent.com/p/opaque1=w1600-h1200-k-no'],
      gallery: [
        'https://lh3.googleusercontent.com/p/opaque1=w1600-h1200-k-no',
        'https://lh3.googleusercontent.com/p/opaque2=w1600-h1200-k-no',
        'https://lh3.googleusercontent.com/p/opaque3=w1600-h1200-k-no',
        'https://lh3.googleusercontent.com/p/opaque4=w1600-h1200-k-no',
        'https://lh3.googleusercontent.com/p/opaque5=w1600-h1200-k-no',
        'https://lh3.googleusercontent.com/p/opaque6=w1600-h1200-k-no',
      ],
      projectAlbums: [
        {
          id: 'google_photos',
          title: 'Google Photos',
          description: 'Imported from Google Business Profile.',
          category: '',
          sourceUrl: 'https://maps.google.com/example',
          coverImageUrl: 'https://lh3.googleusercontent.com/p/opaque1=w1600-h1200-k-no',
          enabled: true,
          displayOrder: 0,
          photos: [
            { id: 'g1', url: 'https://lh3.googleusercontent.com/p/opaque1=w1600-h1200-k-no', alt: 'Example Co photo 1', caption: '', displayOrder: 0 },
            { id: 'g2', url: 'https://lh3.googleusercontent.com/p/opaque2=w1600-h1200-k-no', alt: 'Example Co photo 2', caption: '', displayOrder: 1 },
            { id: 'g3', url: 'https://lh3.googleusercontent.com/p/opaque3=w1600-h1200-k-no', alt: 'Example Co photo 3', caption: '', displayOrder: 2 },
            { id: 'g4', url: 'https://lh3.googleusercontent.com/p/opaque4=w1600-h1200-k-no', alt: 'Example Co photo 4', caption: '', displayOrder: 3 },
            { id: 'g5', url: 'https://lh3.googleusercontent.com/p/opaque5=w1600-h1200-k-no', alt: 'Example Co photo 5', caption: '', displayOrder: 4 },
            { id: 'g6', url: 'https://lh3.googleusercontent.com/p/opaque6=w1600-h1200-k-no', alt: 'Example Co photo 6', caption: '', displayOrder: 5 },
          ],
        },
      ],
      colours: { primary: '', secondary: '', tertiary: '' },
    },
  });

  const albums = result.photosJson.projectAlbums ?? [];
  const titles = albums.map((album) => album.title);

  assert.ok(albums.length >= 3, `Expected opaque Google photos to be spread into service albums, got ${titles.join(', ')}`);
  assert.ok(titles.some((title) => /Plumbing/i.test(title)), `Missing plumbing album in ${titles.join(', ')}`);
  assert.ok(titles.some((title) => /Roofing/i.test(title)), `Missing roofing album in ${titles.join(', ')}`);
  assert.ok(titles.some((title) => /Outdoor/i.test(title)), `Missing outdoor album in ${titles.join(', ')}`);
  assert.ok(albums.every((album) => album.photos.length > 0), 'Every generated service album should contain photos');
  assert.ok(!albums.some((album) => album.title === 'Google Photos'), 'Opaque Google Photos album should be replaced by service albums');
});

test('Website Brief QA Agent splits opaque same-category trade photos by service line labels', () => {
  const result = runWebsiteBriefQaAgent({
    ...baseInput,
    brief: {
      ...baseInput.brief,
      industry: 'trades',
      services: 'Electrical services\nRepairs and fault finding\nInstallations\nRewiring enquiries\nEV charger enquiries',
    },
    photosJson: {
      logo: '',
      heroImages: ['https://lh3.googleusercontent.com/p/electrical1=w1600-h1200-k-no'],
      gallery: Array.from({ length: 10 }, (_, i) => `https://lh3.googleusercontent.com/p/electrical${i + 1}=w1600-h1200-k-no`),
      projectAlbums: [
        {
          id: 'google_photos',
          title: 'Google Photos',
          description: 'Imported from Google Business Profile.',
          category: '',
          sourceUrl: 'https://www.google.com/maps/search/?api=1&query=Desa%20Electrical%20Ltd',
          coverImageUrl: 'https://lh3.googleusercontent.com/p/electrical1=w1600-h1200-k-no',
          enabled: true,
          displayOrder: 0,
          photos: Array.from({ length: 10 }, (_, i) => ({
            id: `g${i + 1}`,
            url: `https://lh3.googleusercontent.com/p/electrical${i + 1}=w1600-h1200-k-no`,
            alt: `Desa Electrical Ltd photo ${i + 1}`,
            caption: '',
            displayOrder: i,
          })),
        },
      ],
      colours: { primary: '', secondary: '', tertiary: '' },
    },
  });

  const albums = result.photosJson.projectAlbums ?? [];
  const titles = albums.map((album) => album.title);

  assert.ok(albums.length >= 4, `Expected service-line albums, got ${titles.join(', ')}`);
  assert.ok(titles.some((title) => /Repairs/i.test(title)), `Missing repairs album in ${titles.join(', ')}`);
  assert.ok(titles.some((title) => /Installations/i.test(title)), `Missing installations album in ${titles.join(', ')}`);
  assert.ok(titles.some((title) => /Rewiring/i.test(title)), `Missing rewiring album in ${titles.join(', ')}`);
  assert.ok(titles.some((title) => /EV Charger/i.test(title)), `Missing EV charger album in ${titles.join(', ')}`);
  assert.ok(!albums.some((album) => album.title === 'Google Photos'), 'Google Photos album should be replaced by service-line albums');
});

test('Website Brief QA Agent generates editable branding, SEO suggestions and scoring when missing', () => {
  const result = runWebsiteBriefQaAgent(baseInput);

  assert.equal(result.photosJson.logoSource, 'generated');
  assert.match(result.photosJson.generatedLogo!.svg, /SHE/);
  assert.equal(result.photosJson.suggestedBrandColours!.primary, '#0f172a');
  assert.match(result.seo.seoTitle, /S H Electrical/);
  assert.match(result.seo.metaDescription, /Croydon/);
  assert.ok(result.seo.faqSuggestions.length >= 5);
  assert.ok((result.photosJson.qaScore ?? 0) >= 70);
  assert.ok(result.score.categories.ContactCompleteness >= 80);
});

test('Website Brief QA Agent escapes generated SVG logo text and rejects unsafe colour overrides', () => {
  const result = runWebsiteBriefQaAgent({
    ...baseInput,
    businessName: 'Bad " onload="alert(1)',
    brief: { ...baseInput.brief, industry: 'electric" onclick="alert(2)' },
    photosJson: {
      ...baseInput.photosJson as Record<string, unknown>,
      suggestedBrandColours: {
        primary: 'red" onload="alert(3)',
        secondary: '#2563eb',
        accent: 'url(javascript:alert(4))',
        background: '#ffffff',
        text: '#111827',
      },
    },
  });

  const svg = result.photosJson.generatedLogo!.svg;
  assert.doesNotMatch(svg, /onload="|onclick="|javascript:/i);
  assert.match(svg, /Bad &quot; onload=&quot;alert\(1\)/);
  assert.match(svg, /fill="#111827"/);
});

test('Website Brief QA Agent preserves manual before-after pairs that were not auto-detected', () => {
  const result = runWebsiteBriefQaAgent({
    ...baseInput,
    photosJson: {
      logo: '',
      heroImages: [],
      gallery: ['https://cdn.test/manual-before.jpg', 'https://cdn.test/manual-after.jpg'],
      projectAlbums: [],
      beforeAfterPairs: [
        {
          id: 'manual_pair_1',
          title: 'Manual driveway comparison',
          beforeImage: 'https://cdn.test/manual-before.jpg',
          afterImage: 'https://cdn.test/manual-after.jpg',
          beforeUrl: 'https://cdn.test/manual-before.jpg',
          afterUrl: 'https://cdn.test/manual-after.jpg',
          serviceCategory: 'Driveways',
          category: 'Driveways',
          description: 'Manually added before/after pair',
          caption: 'Manual pair',
          displayOrder: 7,
          enabled: true,
        },
      ],
      colours: { primary: '', secondary: '', tertiary: '' },
    },
  });

  const pairs = result.photosJson.beforeAfterPairs ?? [];
  assert.ok(pairs.some((pair) => pair.id === 'manual_pair_1'), 'Manual before/after pair should survive QA');
  assert.equal(pairs.find((pair) => pair.id === 'manual_pair_1')?.title, 'Manual driveway comparison');
});

test('Website Brief QA Agent preserves manual hero images when no better hero candidate is found', () => {
  const manualHero = 'https://cdn.test/manual-hero-portrait.jpg';
  const result = runWebsiteBriefQaAgent({
    ...baseInput,
    photosJson: {
      logo: '',
      heroImages: [manualHero],
      hero: manualHero,
      gallery: [manualHero],
      projectAlbums: [],
      colours: { primary: '', secondary: '', tertiary: '' },
    },
  });

  assert.deepEqual(result.photosJson.heroImages, [manualHero]);
  assert.equal(result.photosJson.primaryHeroImage, manualHero);
  assert.equal(result.photosJson.hero, manualHero);
});

test('Website Brief QA Agent stores the complete qaChanges list including SEO and photo organisation changes', () => {
  const result = runWebsiteBriefQaAgent(baseInput);
  const summaries = (result.photosJson.qaChanges ?? []).map((change) => change.summary);

  assert.ok(summaries.some((summary) => /Categorised photos/i.test(summary)));
  assert.ok(summaries.some((summary) => /local SEO/i.test(summary)));
});
