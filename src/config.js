export const APP_CONFIG = {
  station: {
    name: 'Gangnam Station',
    lon: 127.02758,
    lat: 37.49793,
    radiusM: 650,
    fetchRadiusM: 650,
    speedKmh: 4,
    voxelSizeXYM: 10,
    voxelSizeZM: 10
  },
  data: {
    buildingsUrl: './data/processed/buildings.geojson',
    entrancesUrl: './data/processed/entrances.geojson',
    voxelsUrl: './data/processed/voxels.json',
    statsUrl: './data/processed/voxel_stats.json'
  },
  camera: {
    rangeM: 1850,
    headingDeg: 0,
    pitchDeg: -45
  }
};
