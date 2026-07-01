export const ACCESS_CLASSES = [
  { id: 0, label: '0-3분 · 매우 가까움', maxMinutes: 3, color: '#2c7bb6' },
  { id: 1, label: '3-5분 · 가까움', maxMinutes: 5, color: '#00a6ca' },
  { id: 2, label: '5-7분 · 보통', maxMinutes: 7, color: '#ffffbf' },
  { id: 3, label: '7-10분 · 멂', maxMinutes: 10, color: '#fdae61' },
  { id: 4, label: '10분 초과 · 매우 멂', maxMinutes: Infinity, color: '#d7191c' }
];

export function classForAccessTime(minutes) {
  if (minutes <= 3) return 0;
  if (minutes <= 5) return 1;
  if (minutes <= 7) return 2;
  if (minutes <= 10) return 3;
  return 4;
}

export function classForVerticalMeters(meters) {
  if (meters <= 15) return 0;
  if (meters <= 30) return 1;
  if (meters <= 60) return 2;
  if (meters <= 90) return 3;
  return 4;
}

export function classForVoxelMetric(voxel, metric) {
  if (metric === 'distance') {
    return classForAccessTime(voxel.access_dist_m / (4000 / 60));
  }
  if (metric === 'vertical') {
    return classForVerticalMeters(voxel.vertical_dist_m);
  }
  return classForAccessTime(voxel.access_time_min);
}

export function colorForClass(Cesium, classId, alpha = 0.65) {
  const rampItem = ACCESS_CLASSES[classId] || ACCESS_CLASSES[ACCESS_CLASSES.length - 1];
  return Cesium.Color.fromCssColorString(rampItem.color).withAlpha(alpha);
}

export function renderLegend(target) {
  target.innerHTML = ACCESS_CLASSES.map((item) => (
    `<div class="legend-row">
      <span class="swatch" style="background:${item.color}"></span>
      <span>${item.label}</span>
    </div>`
  )).join('');
}
