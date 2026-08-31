import Map from '../gis/map/map.js';
import Alpine from 'alpinejs';

Alpine.data('mapApp', ({
  params=null,
}={}) => ({
    init() {
      this.$nextTick(async () => {
        const map = await Map.create(this.$el, JSON.parse(params))
      });
    },
}))

export default ({
  params=null
}={}) => {
  return `
  <div 
    x-id="['map']" 
    :id="$id('map')" 
    :class="{
      ['bg-'+color+'-200/100! dark:bg-'+color+'-950/100!']: true,
    }"
    class="size-full z-0" 
    x-data="mapApp({params:'${utils.objToStr(params)}'})"
  ></div>
  `
}