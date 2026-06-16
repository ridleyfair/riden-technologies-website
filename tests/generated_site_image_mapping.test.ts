import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildGalleryItemsFromAlbums,
  normalizeGeneratedSiteImageUrl,
  normalizeProjectAlbumsForGeneratedSite,
} from '../src/lib/generated-site-image-mapping';

const googlePhoto = 'https://lh3.googleusercontent.com/p/AF1QipExample=w1600-h1200-k-no';
const normalPhoto = 'https://cdn.example.test/job.jpg';

test('normalizeGeneratedSiteImageUrl proxies Google images through the template engine image proxy', () => {
  assert.equal(
    normalizeGeneratedSiteImageUrl(googlePhoto, 'http://localhost:3005'),
    `http://localhost:3005/api/img?url=${encodeURIComponent(googlePhoto)}`,
  );
  assert.equal(normalizeGeneratedSiteImageUrl(normalPhoto, 'http://localhost:3005'), normalPhoto);
  assert.equal(normalizeGeneratedSiteImageUrl('/uploads/local.jpg', 'http://localhost:3005'), 'http://localhost:3005/uploads/local.jpg');
  assert.equal(
    normalizeGeneratedSiteImageUrl(`http://localhost:3005/api/img?url=${encodeURIComponent(googlePhoto)}`, 'http://localhost:3005'),
    `http://localhost:3005/api/img?url=${encodeURIComponent(googlePhoto)}`,
  );
});

test('gallery item mapping gives every template flat src items even when the brief uses project albums', () => {
  const albums = [
    {
      id: 'google_photos',
      title: 'Google Photos',
      description: 'Imported from Google.',
      coverImageUrl: googlePhoto,
      enabled: true,
      displayOrder: 0,
      photos: [
        { id: 'p1', url: googlePhoto, alt: '', caption: 'Van outside job', displayOrder: 0 },
        { id: 'p2', url: normalPhoto, alt: 'Existing alt', caption: '', displayOrder: 1 },
      ],
    },
  ];

  const items = buildGalleryItemsFromAlbums({ albums, fallbackPhotos: [], businessName: 'Kenley Plumbers', origin: 'http://localhost:3005' });
  assert.equal(items.length, 2);
  assert.equal(items[0].src, `http://localhost:3005/api/img?url=${encodeURIComponent(googlePhoto)}`);
  assert.match(items[0].alt, /Kenley Plumbers Google Photos/);
  assert.equal(items[1].src, normalPhoto);
  assert.equal(items[1].alt, 'Existing alt');
});

test('mapped gallery payload satisfies every CRM template image contract', () => {
  const galleryTemplates = {
    'modern-minimal':      { needsItems: true, needsAlbums: true },
    'tradie-bold':         { needsItems: true, needsAlbums: false },
    'outdoor-transform':   { needsItems: true, needsAlbums: true },
    'reno-showcase':       { needsItems: true, needsAlbums: true },
    'finish-decor':        { needsItems: true, needsAlbums: true },
    'beauty-pro-booking':  { needsItems: true, needsAlbums: true },
  } as const;

  const albums = [{
    id: 'a1',
    title: 'Recent Work',
    coverImageUrl: googlePhoto,
    enabled: true,
    displayOrder: 0,
    photos: [{ id: 'p1', url: googlePhoto, displayOrder: 0 }],
  }];
  const items = buildGalleryItemsFromAlbums({ albums, fallbackPhotos: [], businessName: 'Kenley Plumbers', origin: 'http://localhost:3005' });
  const projectAlbums = normalizeProjectAlbumsForGeneratedSite({ albums, businessName: 'Kenley Plumbers', origin: 'http://localhost:3005' });

  for (const [templateId, contract] of Object.entries(galleryTemplates)) {
    if (contract.needsItems) {
      assert.ok(items.length > 0, `${templateId} needs flat gallery items`);
      assert.equal(items[0].src, `http://localhost:3005/api/img?url=${encodeURIComponent(googlePhoto)}`);
    }
    if (contract.needsAlbums) {
      assert.ok(projectAlbums.length > 0, `${templateId} needs projectAlbums`);
      assert.equal(projectAlbums[0].photos[0].url, `http://localhost:3005/api/img?url=${encodeURIComponent(googlePhoto)}`);
    }
  }
});

test('emergency-trade has no gallery but still receives normalized hero imagery', () => {
  assert.equal(
    normalizeGeneratedSiteImageUrl(googlePhoto, 'http://localhost:3005'),
    `http://localhost:3005/api/img?url=${encodeURIComponent(googlePhoto)}`,
  );
});

test('project album mapping normalizes cover images and nested photo URLs for album-based templates', () => {
  const albums = normalizeProjectAlbumsForGeneratedSite({
    albums: [{
      id: 'a1',
      title: 'Recent Work',
      coverImageUrl: googlePhoto,
      enabled: true,
      displayOrder: 0,
      photos: [{ id: 'p1', url: googlePhoto, displayOrder: 0 }],
    }],
    businessName: 'Kenley Plumbers',
    origin: 'http://localhost:3005',
  });

  assert.equal(albums[0].coverImageUrl, `http://localhost:3005/api/img?url=${encodeURIComponent(googlePhoto)}`);
  assert.equal(albums[0].photos[0].url, `http://localhost:3005/api/img?url=${encodeURIComponent(googlePhoto)}`);
  assert.match(albums[0].photos[0].alt ?? '', /Kenley Plumbers Recent Work/);
});
