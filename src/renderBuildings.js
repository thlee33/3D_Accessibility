export async function renderBuildings(viewer, buildingsGeojson) {
  const dataSource = await Cesium.GeoJsonDataSource.load(buildingsGeojson, {
    clampToGround: false
  });

  for (const entity of dataSource.entities.values) {
    const height = getPropertyNumber(entity.properties, 'height_m', 12);
    const minHeight = getPropertyNumber(entity.properties, 'min_height_m', 0);
    entity._baseHeightM = height;
    entity._baseMinHeightM = minHeight;
    entity.polygon.height = minHeight;
    entity.polygon.extrudedHeight = height;
    entity.polygon.material = new Cesium.ColorMaterialProperty(
      Cesium.Color.WHITE.withAlpha(0.22)
    );
    entity.polygon.outline = true;
    entity.polygon.outlineColor = Cesium.Color.WHITE.withAlpha(0.48);
  }

  viewer.dataSources.add(dataSource);
  dataSource.setShow = (show) => {
    dataSource.show = show;
    viewer.scene.requestRender();
  };
  dataSource.setHeightScale = (scale = 1) => {
    for (const entity of dataSource.entities.values) {
      entity.polygon.height = entity._baseMinHeightM * scale;
      entity.polygon.extrudedHeight = entity._baseHeightM * scale;
    }
    viewer.scene.requestRender();
  };
  return dataSource;
}

function getPropertyNumber(properties, name, fallback) {
  if (!properties || !properties[name]) return fallback;
  const value = properties[name].getValue();
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}
