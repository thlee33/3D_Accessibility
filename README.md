# 강남역 3D 복셀 접근성 지도 - 정적 웹 배포본

이 폴더는 GitHub Pages, Netlify, Vercel Static Hosting, S3 Static Website 같은 정적 웹서비스에 그대로 올릴 수 있는 최소 배포본입니다.

## 포함 파일

```text
web/
  index.html
  src/
    app.js
    styles.css
    config.js
    colorRamp.js
    cesiumVoxelBoxRenderer.js
    cesiumVoxelPrimitiveRenderer.js
    interaction.js
    renderBuildings.js
  data/
    processed/
      buildings.geojson
      entrances.geojson
      voxels.json
      voxel_stats.json
```

## 배포 방법

### GitHub Pages

1. 이 저장소를 GitHub에 올립니다.
2. GitHub 저장소의 `Settings > Pages`로 이동합니다.
3. Source를 `Deploy from a branch`로 선택합니다.
4. Branch는 배포 브랜치, Folder는 `/web`으로 선택합니다.
5. 발행된 Pages URL에서 `index.html`이 자동으로 열립니다.

### 로컬 확인

프로젝트 루트에서 실행합니다.

```powershell
node scripts/serve.js
```

또는 `web` 폴더만 별도 서버에 올려도 됩니다. `file://`로 직접 열면 브라우저의 CORS 정책 때문에 JSON 로딩이 막힐 수 있으므로 HTTP 서버를 권장합니다.

## 외부 의존성

- CesiumJS CDN: `https://cdn.jsdelivr.net/npm/cesium@1.142.0`
- 배경지도 타일: OpenStreetMap, Carto fallback

앱 자체 데이터는 `web/data/processed`에 고정되어 있으므로 Overpass API 호출 없이 실행됩니다.

## 현재 데이터 요약

- 대상지: 강남역 중심 반경 650m
- 복셀 크기: 10m x 10m x 10m
- 표시 건물: 447개
- 복셀: 13,361개
- 출입구: 5개
- 접근시간 모델: 1층은 복셀별 출입구 유클리드 거리, 2층 이상은 건물별 대표 수평거리 + 수직거리
