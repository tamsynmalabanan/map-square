import Map from '../gis/map/map.js';
import Alpine from 'alpinejs';

Alpine.data('mapApp', ({
  config=null,
}={}) => ({
    init() {
      this.$nextTick(() => {
        const map = new Map(this.$el, config)
        // NOTE: $watch darkMode, color changes
      });
    },
}))

export default ({
  config=null,
}={}) => {
  return `
  <div 
    x-id="['map']" 
    :id="$id('map')" 
    :class="{
      ['bg-'+color+'-100/10! dark:bg-'+color+'-950/10!']: true,
    }"
    class="size-full z-0" 
    x-data="mapApp(${utils.objToStr(config)})"
  ></div>
  `
}