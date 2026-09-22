const unsplash = (id, width = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=80`;

export const heroImages = [
  'photo-1492684223066-81342ee5ff30',
  'photo-1540575467063-178a50c2df87',
  'photo-1470229722913-7c0e2dbbafd3',
  'photo-1511632765486-a01980e01a18',
].map((id) => unsplash(id, 2000));
export const fallbackImage = unsplash('photo-1506157786151-b8491531f063');

// Category image pools used when an event has no gallery of its own.
const pools = {
  technology: [
    'photo-1540575467063-178a50c2df87',
    'photo-1515187029135-18ee286d815b',
    'photo-1591115765373-5207764f72e7',
  ],
  music: [
    'photo-1470229722913-7c0e2dbbafd3',
    'photo-1459749411175-04bf5292ceea',
    'photo-1514525253161-7a46d19cd819',
  ],
  art: [
    'photo-1531058020387-3be344556be6',
    'photo-1513364776144-60967b0f800f',
    'photo-1460661419201-fd4cecdf8a8b',
  ],
  design: [
    'photo-1558655146-9f40138edfeb',
    'photo-1586717791821-3f44a563fa4c',
    'photo-1523726491678-bf852e717f6a',
  ],
  food: [
    'photo-1555939594-58d7cb561ad1',
    'photo-1414235077428-338989a2e8c0',
    'photo-1476224203421-9ac39bcb3327',
  ],
  community: [
    'photo-1511632765486-a01980e01a18',
    'photo-1529156069898-49953e39b3ac',
    'photo-1523580494863-6f3031224c94',
  ],
  wellness: [
    'photo-1545205597-3d9d02c29597',
    'photo-1506126613408-eca07ce68773',
    'photo-1544367567-0f2fcb009e0b',
  ],
};

const poolFor = (category = '') =>
  (pools[category.toLowerCase()] || pools.community).map((id) => unsplash(id));

export const imageFor = (category, image) => image || poolFor(category)[0];

// Always returns three images: the event's own gallery first, then category images.
export const galleryFor = (event) =>
  [...(event.images || []), ...poolFor(event.category).filter((url) => url !== event.image)].slice(
    0,
    3,
  );
