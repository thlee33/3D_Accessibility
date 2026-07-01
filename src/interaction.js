export function setupInteraction(viewer) {
  const details = document.getElementById('details');
  const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);

  handler.setInputAction((movement) => {
    const picked = viewer.scene.pick(movement.position);
    if (!Cesium.defined(picked) || !picked.id) {
      details.textContent = '복셀을 클릭하면 접근시간, 접근거리, 수직거리, 건물 ID가 표시됩니다.';
      return;
    }

    if (picked.id.type === 'voxel') {
      renderVoxelDetails(details, picked.id.voxel);
      return;
    }

    if (picked.id.properties) {
      renderBuildingDetails(details, picked.id.properties);
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

  return handler;
}

function renderVoxelDetails(target, voxel) {
  target.innerHTML = `
    <div class="detail-title">${escapeHtml(voxel.id)} · ${escapeHtml(voxel.building_name || voxel.building_id)}</div>
    <div class="detail-grid">
      <span>접근시간</span><strong>${formatNumber(voxel.access_time_min, 2)}분</strong>
      <span>접근거리</span><strong>${formatNumber(voxel.access_dist_m, 1)}m</strong>
      <span>수평거리</span><strong>${formatNumber(voxel.horizontal_walk_m, 1)}m</strong>
      <span>수직거리</span><strong>${formatNumber(voxel.vertical_dist_m, 1)}m</strong>
      <span>복셀 높이</span><strong>${formatNumber(voxel.z, 1)}m</strong>
      <span>건물 높이</span><strong>${formatNumber(voxel.height_m, 1)}m</strong>
      <span>건물 ID</span><strong>${escapeHtml(voxel.building_id)}</strong>
    </div>
  `;
}

function renderBuildingDetails(target, properties) {
  const id = readProperty(properties, 'building_id', 'unknown');
  const name = readProperty(properties, 'name', id);
  const height = readProperty(properties, 'height_m', 'n/a');
  target.innerHTML = `
    <div class="detail-title">${escapeHtml(name)}</div>
    <div class="detail-grid">
      <span>건물 ID</span><strong>${escapeHtml(id)}</strong>
      <span>추정 높이</span><strong>${escapeHtml(String(height))}m</strong>
    </div>
  `;
}

function readProperty(properties, name, fallback) {
  if (!properties || !properties[name]) return fallback;
  return properties[name].getValue();
}

function formatNumber(value, digits) {
  return Number(value).toLocaleString('ko-KR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
