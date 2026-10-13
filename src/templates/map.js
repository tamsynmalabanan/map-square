import Map from '../gis/map/map.js';
import Alpine from 'alpinejs';

Alpine.data('mapApp', ({
  params=null,
}={}) => ({
    locked: false,
    vectorEdit: false,
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
      ['${utils.dynamicThemeExp()}']: true,
    }"
    class="size-full z-0" 
    x-data="mapApp({params:'${utils.objToStr(params)}'})"
  ></div>
  `
}