import * as svg from '../../svg.js'
import button from '../../templates/button.js';
import Map from './map.js'

export default class ZoomToBookmarkControl {
  onAdd(map) {
    this._map = map
    const container = this._container = document.createElement('div')
    container.classList.add('maplibregl-ctrl','maplibregl-ctrl-group')

    container.innerHTML = button({
        title: 'Zoom to Bookmarked Location',
        icon: svg.mapPinMini,
        classStr: 'maplibregl-ctrl-zoom-to-bookmark',
    })

    container.firstElementChild.addEventListener('click', () => {
        this.goToBookmark()
    })

    return container
  }

  goToBookmark() {
    const map = this._map
    const settings = map.getTheme().settings

    if (map._locked) return

    const bookmark = settings.bookmark
    const extent = bookmark.extents[bookmark.active]

    if (bookmark.active === 'centroid') {
        map.setZoom(extent.params.zoom)
        map.setCenter(Array('lng','lat').map(i => extent.params[i]))
    } 
    
    if (bookmark.active === 'bbox') {
        map.fitBounds(Array('w','s','e','n').map(i => extent.params[i]), {
            padding: extent.params.padding,
            maxZoom: extent.params.maxZoom,
            duration: 0
        })
    }

    map.setPitch(bookmark.pitch)
    map.setBearing(bookmark.bearing)
  }

  onRemove() {
    this._container.parentNode.removeChild(this._container);
    this._map = undefined;
  }
}