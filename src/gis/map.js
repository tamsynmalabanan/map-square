import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

export default class Map extends maplibregl.Map {
  constructor(options) {
    super(options);
  }

//   addRasterBasemap(urlTemplate, attribution) {
//     this.addSource('basemap', {
//       type: 'raster',
//       tiles: [urlTemplate],
//       tileSize: 256,
//       attribution
//     });

//     this.addLayer({
//       id: 'basemap',
//       type: 'raster',
//       source: 'basemap'
//     });
//   }

//   resetZoom(level = 0) {
//     this.setZoom(level);
//     this.setCenter([0, 0]);
//   }
}
