import { APP_CONFIG } from './config.js';
import { renderLegend } from './colorRamp.js';
import { renderVoxelBoxes } from './cesiumVoxelBoxRenderer.js';
import { renderBuildings } from './renderBuildings.js';
import { setupInteraction } from './interaction.js';

const els = {
  status: document.getElementById('status'),
  summaryMeta: document.getElementById('summaryMeta'),
  legend: document.getElementById('legend'),
  toggleBuildings: document.getElementById('toggleBuildings'),
  toggleVoxels: document.getElementById('toggleVoxels'),
  metricSelect: document.getElementById('metricSelect'),
  heightScale: document.getElementById('heightScale'),
  alphaRange: document.getElementById('alphaRange'),
  basemapAlpha: document.getElementById('basemapAlpha'),
  timeFilter: document.getElementById('timeFilter')
};

let activeBasemapLayer = null;
let currentBasemapAlpha = 1;

renderLegend(els.legend);

try {
  Cesium.Ion.defaultAccessToken = '';

  const viewer = createViewer();
  flyToStation(viewer);

  const [buildings, entrances, voxels, stats] = await Promise.all([
    loadJson(APP_CONFIG.data.buildingsUrl),
    loadJson(APP_CONFIG.data.entrancesUrl),
    loadJson(APP_CONFIG.data.voxelsUrl),
    loadJson(APP_CONFIG.data.statsUrl).catch(() => null)
  ]);

  const buildingLayer = await renderBuildings(viewer, buildings);
  const voxelLayer = renderVoxelBoxes(viewer, voxels.voxels, {
    voxelSizeXYM: voxels.metadata.voxel_size_xy_m,
    voxelSizeZM: voxels.metadata.voxel_size_z_m
  });

  setupInteraction(viewer);
  setupControls(viewer, buildingLayer, voxelLayer, voxels.metadata);
  renderEntranceMarkers(viewer, entrances);
  updateStatus(voxels, buildings, entrances, stats);
} catch (error) {
  console.error(error);
  els.status.textContent = `실행 오류: ${error.message}`;
}

function createViewer() {
  const viewer = new Cesium.Viewer('cesiumContainer', {
    animation: false,
    baseLayer: false,
    baseLayerPicker: false,
    fullscreenButton: false,
    geocoder: false,
    homeButton: true,
    infoBox: false,
    sceneModePicker: false,
    selectionIndicator: false,
    timeline: false,
    navigationHelpButton: false,
    terrainProvider: new Cesium.EllipsoidTerrainProvider(),
    requestRenderMode: false
  });

  installGrayBasemap(viewer);
  viewer.scene.backgroundColor = Cesium.Color.fromCssColorString('#eef2f5');
  viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString('#edf1f4');
  viewer.scene.globe.showGroundAtmosphere = false;
  if (viewer.scene.skyAtmosphere) viewer.scene.skyAtmosphere.show = false;
  if (viewer.scene.skyBox) viewer.scene.skyBox.show = false;
  if (viewer.scene.sun) viewer.scene.sun.show = false;
  if (viewer.scene.moon) viewer.scene.moon.show = false;

  return viewer;
}

function installGrayBasemap(viewer) {
  viewer.imageryLayers.removeAll();

  const osmProvider = new Cesium.UrlTemplateImageryProvider({
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    credit: '© OpenStreetMap contributors',
    minimumLevel: 0,
    maximumLevel: 19
  });

  let switchedToFallback = false;
  osmProvider.errorEvent.addEventListener((tileProviderError) => {
    tileProviderError.retry = true;
    if (!switchedToFallback && tileProviderError.timesRetried >= 2) {
      switchedToFallback = true;
      addCartoFallback(viewer);
    }
  });

  activeBasemapLayer = viewer.imageryLayers.addImageryProvider(osmProvider, 0);
  styleGrayBasemapLayer(activeBasemapLayer);
}

function addCartoFallback(viewer) {
  viewer.imageryLayers.removeAll();
  const cartoProvider = new Cesium.UrlTemplateImageryProvider({
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
    subdomains: ['a', 'b', 'c', 'd'],
    credit: '© OpenStreetMap contributors, © CARTO',
    minimumLevel: 0,
    maximumLevel: 20
  });
  activeBasemapLayer = viewer.imageryLayers.addImageryProvider(cartoProvider, 0);
  styleGrayBasemapLayer(activeBasemapLayer);
}

function styleGrayBasemapLayer(layer) {
  layer.alpha = currentBasemapAlpha;
  layer.brightness = 1.02;
  layer.contrast = 1.24;
  layer.saturation = 0;
  layer.gamma = 0.9;
}

function flyToStation(viewer) {
  const target = Cesium.Cartesian3.fromDegrees(
    APP_CONFIG.station.lon,
    APP_CONFIG.station.lat,
    0
  );
  const offset = new Cesium.HeadingPitchRange(
    Cesium.Math.toRadians(APP_CONFIG.camera.headingDeg),
    Cesium.Math.toRadians(APP_CONFIG.camera.pitchDeg),
    APP_CONFIG.camera.rangeM
  );
  viewer.camera.lookAt(target, offset);
  viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
}

async function loadJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${url} 로드 실패 (${response.status})`);
  }
  return response.json();
}

function setupControls(viewer, buildingLayer, voxelLayer, metadata) {
  els.toggleBuildings.addEventListener('change', () => {
    buildingLayer.setShow(els.toggleBuildings.checked);
  });

  els.toggleVoxels.addEventListener('change', () => {
    voxelLayer.setShow(els.toggleVoxels.checked);
  });

  for (const control of [els.metricSelect, els.heightScale, els.alphaRange, els.timeFilter]) {
    control.addEventListener('input', () => {
      const heightScale = Number(els.heightScale.value);
      buildingLayer.setHeightScale(heightScale);
      voxelLayer.render({
        metric: els.metricSelect.value,
        heightScale,
        alpha: Number(els.alphaRange.value),
        timeFilter: els.timeFilter.value,
        show: els.toggleVoxels.checked,
        voxelSizeXYM: metadata.voxel_size_xy_m,
        voxelSizeZM: metadata.voxel_size_z_m
      });
    });
  }

  els.basemapAlpha.addEventListener('input', () => {
    currentBasemapAlpha = Number(els.basemapAlpha.value);
    if (activeBasemapLayer) {
      activeBasemapLayer.alpha = currentBasemapAlpha;
      viewer.scene.requestRender();
    }
  });
}

function renderEntranceMarkers(viewer, entrances) {
  for (const feature of entrances.features) {
    const [lon, lat] = feature.geometry.coordinates;
    viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(lon, lat, 3),
      point: {
        pixelSize: 7,
        color: Cesium.Color.LIME.withAlpha(0.95),
        outlineColor: Cesium.Color.BLACK.withAlpha(0.8),
        outlineWidth: 1
      },
      label: {
        text: feature.properties.name || 'Exit',
        font: '11px system-ui',
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        fillColor: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        pixelOffset: new Cesium.Cartesian2(0, -16),
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      }
    });
  }
}

function updateStatus(voxels, buildings, entrances, stats) {
  const source = stats?.source === 'overpass'
    ? 'Overpass OSM'
    : 'fallback sample';
  els.summaryMeta.textContent = `반경 ${voxels.metadata.radius_m}m · ${voxels.metadata.voxel_size_xy_m}m 복셀 · 보행속도 ${voxels.metadata.speed_kmh}km/h`;
  els.status.textContent = `${source} 데이터 · 건물 ${buildings.features.length.toLocaleString('ko-KR')}개 · 복셀 ${voxels.voxels.length.toLocaleString('ko-KR')}개 · 출입구 ${entrances.features.length}개`;
}
