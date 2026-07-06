import Map from '../gis/map.js';

const template = `

`;

export default () => {
  return {
    template: `<div x-id="['map']" :id="$id('map')" class="h-full z-0" x-data="mapApp()"></div>`,
    
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
  }
}