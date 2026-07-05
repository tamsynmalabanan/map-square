import Map from '../gis/map.js';

const template = `
<div x-id="['map']" :id="$id('map')" class="h-screen" x-data="mapApp()"></div>
`;

export default () => {
  return {
    template: template,
    
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