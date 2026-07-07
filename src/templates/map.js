import Map from '../gis/map.js';
import Alpine from 'alpinejs';

Alpine.data('mapApp', ({
  config=null,
}={}) => ({
    init() {
      this.$nextTick(() => { new Map(this.$el, config) });
    },
}))

export default ({
  config=null,
}={}) => {
  return `<div x-id="['map']" :id="$id('map')" class="size-full z-0" x-data="mapApp(${utils.objToStr(config)})"></div>`
}