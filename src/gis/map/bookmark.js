import * as svg from '../../svg.js'
import button from '../../templates/button.js';
import Map from './map.js'
import _ from 'lodash';

export default class BookmarkControl {
  onAdd(map) {
    this._map = map
    const container = this._container = document.createElement('div')
    container.classList.add('maplibregl-ctrl','maplibregl-ctrl-group')

    container.innerHTML = button({
        title: 'Zoom to bookmarked location',
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
    if (map._locked) return

    const {active, view, maxZoom, padding, duration} = map.getTheme().settings.bookmark

    const currentView = map.getView()
    if (_.isEqual(currentView, view)) return

    if (active === 'centroid') {
      if (currentView.zoom !== view.zoom) {
        map.setZoom(view.zoom)
      }

      if (Array('lng', 'lat').some(i => currentView[i] !== view[i])) {
        map.setCenter([view.lng, view.lat])
      }
    } 
    
    if (active === 'bbox') {
      const keys = Array('west','south','east','north')
      if (keys.some(i => currentView[i] !== view[i])) {
        map.fitBounds(keys.map(i => view[i]), {
          padding, maxZoom, duration,
        })
      }
    }

    if (currentView.pitch !== view.pitch) {
      map.setPitch(view.pitch)
    }

    if (currentView.bearing !== view.bearing) {
      map.setBearing(view.bearing)
    }
  }

  onRemove() {
    this._container.parentNode.removeChild(this._container);
    this._map = undefined;
  }
}