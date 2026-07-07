import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

export default class Map extends maplibregl.Map {
  constructor(container, config) {
    const options = {
      container: container,
      style: 'https://demotiles.maplibre.org/globe.json',
      center: [0, 0],
      zoom: 1    
    }

    super(options);
  }
}