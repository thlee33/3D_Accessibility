import { classForVoxelMetric, colorForClass } from './colorRamp.js';

export function renderVoxelBoxes(viewer, voxels, options = {}) {
  const state = {
    primitive: null,
    voxels,
    options: normalizeOptions(options)
  };

  state.render = (nextOptions = {}) => {
    state.options = normalizeOptions({ ...state.options, ...nextOptions });
    if (state.primitive) {
      viewer.scene.primitives.remove(state.primitive);
      state.primitive = null;
    }

    const instances = buildInstances(state.voxels, state.options);
    if (!instances.length) {
      viewer.scene.requestRender();
      return state;
    }

    state.primitive = new Cesium.Primitive({
      geometryInstances: instances,
      appearance: new Cesium.PerInstanceColorAppearance({
        translucent: true,
        closed: true
      }),
      asynchronous: true,
      show: state.options.show
    });

    viewer.scene.primitives.add(state.primitive);
    viewer.scene.requestRender();
    return state;
  };

  state.setShow = (show) => {
    state.options.show = show;
    if (state.primitive) {
      state.primitive.show = show;
      viewer.scene.requestRender();
    }
  };

  state.destroy = () => {
    if (state.primitive) {
      viewer.scene.primitives.remove(state.primitive);
      state.primitive = null;
      viewer.scene.requestRender();
    }
  };

  return state.render();
}

function normalizeOptions(options) {
  return {
    metric: options.metric || 'time',
    alpha: Number.isFinite(Number(options.alpha)) ? Number(options.alpha) : 0.65,
    heightScale: Number.isFinite(Number(options.heightScale)) ? Number(options.heightScale) : 1,
    timeFilter: normalizeTimeFilter(options.timeFilter),
    show: options.show !== false,
    voxelSizeXYM: Number(options.voxelSizeXYM || 10),
    voxelSizeZM: Number(options.voxelSizeZM || 10)
  };
}

function buildInstances(voxels, options) {
  return voxels
    .filter((voxel) => matchesTimeFilter(voxel, options.timeFilter))
    .map((voxel) => {
      const classId = classForVoxelMetric(voxel, options.metric);
      const center = Cesium.Cartesian3.fromDegrees(
        voxel.lon,
        voxel.lat,
        Math.max(1, voxel.z * options.heightScale)
      );
      const modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(center);

      return new Cesium.GeometryInstance({
        id: {
          type: 'voxel',
          id: voxel.id,
          voxel
        },
        geometry: Cesium.BoxGeometry.fromDimensions({
          dimensions: new Cesium.Cartesian3(
            options.voxelSizeXYM,
            options.voxelSizeXYM,
            options.voxelSizeZM * options.heightScale
          ),
          vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT
        }),
        modelMatrix,
        attributes: {
          color: Cesium.ColorGeometryInstanceAttribute.fromColor(
            colorForClass(Cesium, classId, options.alpha)
          )
        }
      });
    });
}

function normalizeTimeFilter(value) {
  if (value === 'gt10') return 'gt10';
  const number = Number(value);
  return Number.isFinite(number) ? number : Infinity;
}

function matchesTimeFilter(voxel, filter) {
  if (filter === 'gt10') return voxel.access_time_min > 10;
  return voxel.access_time_min <= filter;
}
