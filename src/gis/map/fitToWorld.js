import * as svg from '../../svg.js'
import button from '../../templates/button.js';
import Map from './map.js'

export default class FitToWorldControl {
  onAdd(map) {
    this._map = map
    const container = this._container = document.createElement('div')
    container.classList.add('maplibregl-ctrl','maplibregl-ctrl-group')

    container.innerHTML = button({
        title: 'Fit to world',
        icon: svg.globeAmericasMini,
        classStr: 'maplibregl-ctrl-fit-to-world',
    })

    container.firstElementChild.addEventListener('click', () => {
        this._map.setPitch(0)
        this._map.setBearing(0)

        const {west,south,east,north} = Map.getDefaultConfig().themes[0].settings.bookmark.view
        this._map.fitBounds([[west,south],[east,north]])
    })

    return container
  }

  onRemove() {
    this._container.parentNode.removeChild(this._container);
    this._map = undefined;
  }
}