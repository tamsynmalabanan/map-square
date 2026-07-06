import Map from '../gis/map.js';
import Alpine from 'alpinejs';

Alpine.data('mapApp', (options={}) => ({
    init() {
      this.$nextTick(() => {
        const map = new Map({
          container: this.$el.id,
          style: 'https://demotiles.maplibre.org/globe.json',
          center: [0, 0],
          zoom: 1
        });
      });
    },
}))

export default (options={}) => {
  return `<div x-id="['map']" :id="$id('map')" class="size-full z-0" x-data="mapApp()"></div>`
}