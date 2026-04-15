/**
 * Central list of corals. Each entry has a unique `slug` used in URLs: /coral/:slug
 */
export const corals = [
  {
    slug: 'staghorn-acropora',
    commonName: 'Staghorn coral',
    scientificName: 'Acropora cervicornis',
    region: 'Caribbean',
    status: 'Critically Endangered',
    depthM: '2–20',
    tags: ['branching', 'reef-building'],
    notes:
      'Fast-growing branching coral that forms dense thickets. Important for shallow reef structure and fish habitat.',
  },
  {
    slug: 'elkhorn-acropora',
    commonName: 'Elkhorn coral',
    scientificName: 'Acropora palmata',
    region: 'Caribbean',
    status: 'Critically Endangered',
    depthM: '1–5',
    tags: ['branching', 'reef-building'],
    notes:
      'Broad, flattened branches resemble elk antlers. Often found in high-energy shallow zones.',
  },
  {
    slug: 'brain-coral',
    commonName: 'Grooved brain coral',
    scientificName: 'Diploria labyrinthiformis',
    region: 'Caribbean',
    status: 'Near Threatened',
    depthM: '1–30',
    tags: ['massive', 'boulder'],
    notes:
      'Slow-growing massive coral with maze-like grooves. Forms large boulders on many Caribbean reefs.',
  },
  {
    slug: 'pillar-dendrogyra',
    commonName: 'Pillar coral',
    scientificName: 'Dendrogyra cylindrus',
    region: 'Caribbean',
    status: 'Critically Endangered',
    depthM: '1–20',
    tags: ['columnar', 'distinctive'],
    notes:
      'Unmistakable upright columns. Often among the first corals noticed on a dive due to their shape.',
  },
];

export function getCoralBySlug(slug) {
  return corals.find((c) => c.slug === slug);
}
