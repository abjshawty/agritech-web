// Hardcoded so town search never depends on a geocoding API. Coordinates are approximate town centres.
export const towns = [
  { name: 'Abengourou', lat: 6.73, lon: -3.5 },
  { name: 'Abidjan', lat: 5.36, lon: -4.01 },
  { name: 'Aboisso', lat: 5.47, lon: -3.21 },
  { name: 'Agboville', lat: 5.93, lon: -4.22 },
  { name: 'Bondoukou', lat: 8.04, lon: -2.8 },
  { name: 'Bouaflé', lat: 6.99, lon: -5.74 },
  { name: 'Bouaké', lat: 7.69, lon: -5.03 },
  { name: 'Bouna', lat: 9.27, lon: -3.0 },
  { name: 'Boundiali', lat: 9.52, lon: -6.49 },
  { name: 'Daloa', lat: 6.88, lon: -6.45 },
  { name: 'Danané', lat: 7.26, lon: -8.15 },
  { name: 'Dimbokro', lat: 6.65, lon: -4.71 },
  { name: 'Divo', lat: 5.84, lon: -5.36 },
  { name: 'Duékoué', lat: 6.74, lon: -7.35 },
  { name: 'Ferkessédougou', lat: 9.59, lon: -5.2 },
  { name: 'Gagnoa', lat: 6.13, lon: -5.95 },
  { name: 'Grand-Bassam', lat: 5.21, lon: -3.74 },
  { name: 'Guiglo', lat: 6.54, lon: -7.49 },
  { name: 'Issia', lat: 6.49, lon: -6.59 },
  { name: 'Katiola', lat: 8.14, lon: -5.1 },
  { name: 'Korhogo', lat: 9.46, lon: -5.63 },
  { name: 'Man', lat: 7.41, lon: -7.55 },
  { name: 'Odienné', lat: 9.51, lon: -7.56 },
  { name: 'San-Pédro', lat: 4.75, lon: -6.64 },
  { name: 'Sassandra', lat: 4.95, lon: -6.08 },
  { name: 'Séguéla', lat: 7.96, lon: -6.67 },
  { name: 'Soubré', lat: 5.79, lon: -6.61 },
  { name: 'Tabou', lat: 4.42, lon: -7.35 },
  { name: 'Touba', lat: 8.28, lon: -7.68 },
  { name: 'Yamoussoukro', lat: 6.82, lon: -5.28 },
]

export type Town = (typeof towns)[number]

// Côte d'Ivoire, matching the API's accepted range.
export const bounds = { lat: [4.3, 10.8], lon: [-8.7, -2.4] } as const

export const inBounds = (lat: number, lon: number) =>
  lat >= bounds.lat[0] && lat <= bounds.lat[1] && lon >= bounds.lon[0] && lon <= bounds.lon[1]
