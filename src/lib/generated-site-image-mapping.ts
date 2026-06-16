type GalleryPhoto = {
  id?: string;
  url: string;
  alt?: string;
  caption?: string;
  displayOrder?: number;
};

type ProjectAlbum = {
  id: string;
  title: string;
  description?: string;
  category?: string;
  sourceUrl?: string;
  coverImageUrl?: string;
  coverUrl?: string;
  photos: GalleryPhoto[];
  enabled: boolean;
  displayOrder: number;
  [key: string]: unknown;
};

export type GeneratedGalleryItem = {
  src: string;
  alt: string;
  caption: string;
};

function isGoogleImageUrl(url: string): boolean {
  return /googleusercontent\.com|googleapis\.com\/maps/i.test(url);
}

export function normalizeGeneratedSiteImageUrl(url: string, origin: string): string {
  if (!url) return '';
  if (url.startsWith('/api/img?')) return `${origin}${url}`;
  if (url.startsWith(`${origin}/api/img?`)) return url;
  if (isGoogleImageUrl(url)) return `${origin}/api/img?url=${encodeURIComponent(url)}`;
  if (url.startsWith('/')) return `${origin}${url}`;
  return url;
}

export function normalizeProjectAlbumsForGeneratedSite({
  albums,
  businessName,
  origin,
}: {
  albums: ProjectAlbum[];
  businessName: string;
  origin: string;
}): ProjectAlbum[] {
  return albums
    .filter((album) => album.enabled && Array.isArray(album.photos) && album.photos.length > 0)
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
    .map((album) => ({
      ...album,
      coverImageUrl: album.coverImageUrl
        ? normalizeGeneratedSiteImageUrl(album.coverImageUrl, origin)
        : album.photos[0]?.url
          ? normalizeGeneratedSiteImageUrl(album.photos[0].url, origin)
          : undefined,
      coverUrl: album.coverUrl ? normalizeGeneratedSiteImageUrl(album.coverUrl, origin) : album.coverUrl,
      photos: album.photos
        .slice()
        .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
        .map((photo, i) => ({
          ...photo,
          url: normalizeGeneratedSiteImageUrl(photo.url, origin),
          alt: photo.alt || `${businessName} ${album.title}${i > 0 ? ` photo ${i + 1}` : ''}`,
          caption: photo.caption || '',
        })),
    }));
}

export function buildGalleryItemsFromAlbums({
  albums,
  fallbackPhotos,
  businessName,
  origin,
}: {
  albums: ProjectAlbum[];
  fallbackPhotos: string[];
  businessName: string;
  origin: string;
}): GeneratedGalleryItem[] {
  const activeAlbums = normalizeProjectAlbumsForGeneratedSite({ albums, businessName, origin });
  const seen = new Set<string>();
  const items: GeneratedGalleryItem[] = [];

  for (const album of activeAlbums) {
    for (const photo of album.photos) {
      if (!photo.url || seen.has(photo.url)) continue;
      seen.add(photo.url);
      items.push({
        src: photo.url,
        alt: photo.alt || `${businessName} ${album.title}`,
        caption: photo.caption || '',
      });
    }
  }

  if (items.length === 0) {
    for (const [i, photoUrl] of fallbackPhotos.entries()) {
      const src = normalizeGeneratedSiteImageUrl(photoUrl, origin);
      if (!src || seen.has(src)) continue;
      seen.add(src);
      items.push({
        src,
        alt: `${businessName} work photo ${i + 1}`,
        caption: '',
      });
    }
  }

  return items;
}
