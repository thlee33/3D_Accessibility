export function isVoxelPrimitiveAvailable() {
  return Boolean(Cesium.VoxelPrimitive && Cesium.CustomShader);
}

export function renderVoxelPrimitive() {
  throw new Error(
    'Cesium VoxelPrimitive support is scaffolded for the second implementation pass; BoxGeometry is the tested renderer for this PoC.'
  );
}
