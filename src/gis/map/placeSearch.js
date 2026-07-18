import button from "../../templates/button.js"
import * as turf from '@turf/turf'
import { searchNominatimOSM } from "../data.js"

export class PlaceSearchControl {
    constructor(options) {
    
    }

    onAdd(map) {
        this._map = map
        const container = this._container = document.createElement('div')
        container.classList.add('maplibregl-ctrl','maplibregl-ctrl-group', 'flex', 'flex-nowrap', 'items-center')
        container.setAttribute('x-data', 'toggleGroup')

        container.innerHTML = button({
            title: 'Place Search',
            icon: svg.magnifyingGlassMini,
            classStr: 'maplibregl-ctrl-place-search',
            attrs: `@click='toggle'`
        })

        const form = document.createElement('div')
        form.classList.add('grid', 'place-items-center')
        form.setAttribute('x-show', 'open')
        form.setAttribute('@click.outside', 'close')
        container.appendChild(form)

        const input = document.createElement('input')
        input.classList.add('mx-1', 'focus:outline-none', 'rounded', 'px-2')
        input.setAttribute('type', 'search')
        input.setAttribute('name', 'placeSearch')
        input.setAttribute('placeholder', 'Search place...')
        input.setAttribute(':class', `{['bg-'+color+'-500/10!']: true}`)
        form.appendChild(input)
        
        let timer
        input.addEventListener('input', () => {
            clearTimeout(timer)
            
            const value = input.value.trim()
            if (value.length < 3) return
            
            timer = setTimeout(async() => {
                await this.runPlaceSearch(value)
            }, 1000);
        })
        
        return container
    }
    
    async runPlaceSearch(place) {
        const map = this._map
        
        let data

        const coords = gisUtils.isLngLatString(place)
        
        if (coords) {
            map.flyTo({center: coords, zoom: Math.max(11, map.getZoom())})
            data = turf.featureCollection([turf.point(coords)])
        } else {
            data = await searchNominatimOSM(place)
        }

        console.log(data)
    }

    onRemove() {
        this._container.parentNode.removeChild(this._container);
        this._map = undefined;
    }
}