import button from "../../templates/button.js"
import * as turf from '@turf/turf'
import { searchNominatimOSM } from "../data.js"
import { createAbortController } from "../../utils.js"

export default class PlaceSearchControl {
    constructor(options) {
    
    }

    onAdd(map) {
        this._map = map
        const container = this._container = document.createElement('div')
        container.classList.add('maplibregl-ctrl','maplibregl-ctrl-group', 'flex', 'flex-nowrap', 'items-center')
        container.setAttribute('x-data', 'collapseGroup')

        container.innerHTML = button({
            title: 'Place Search',
            icon: svg.magnifyingGlassMini,
            classStr: 'maplibregl-ctrl-place-search',
            attrs: `@click='toggleCollapse'`
        })

        const form = document.createElement('div')
        form.classList.add('grid', 'place-items-center')
        form.setAttribute('x-show', '!collapsed')
        form.setAttribute('@click.outside', 'closeCollapse')
        container.appendChild(form)

        const input = document.createElement('input')
        input.classList.add('focus:outline-none', 'rounded', 'px-2')
        input.setAttribute('type', 'search')
        input.setAttribute('name', 'placeSearch')
        input.setAttribute('placeholder', 'Search place...')
        form.appendChild(input)

        let timer
        Array('input', 'keydown').forEach(i => {
            input.addEventListener(i, () => {
                clearTimeout(timer)
                
                map.stop()
                map.getSource('placeSearch')?.setData(turf.featureCollection([]))
                
                const value = input.value.trim()
                if (value.length < 3) return
                
                timer = setTimeout(async() => {
                    await this.runPlaceSearch(value)
                }, 1000);
            })
        })
        
        return container
    }
    
    async runPlaceSearch(place) {
        const map = this._map
        
        const controller = createAbortController({
            name: 'Place search',
            events: [[this._container, ['input']]]
        })
        const {signal} = controller

        
        let data

        const coords = gisUtils.isLngLatString(place)
        
        if (coords) {
            data = turf.featureCollection([turf.point(coords)])
        } else {
            data = await searchNominatimOSM(place, {signal})
        }
        
        const features = data?.features ?? []
        if (features?.length == 0) return
        
        const bbox = turf.bbox(turf.featureCollection(features.map(f => f.bbox ? turf.bboxPolygon(f.bbox) : f)))
        
        if (signal.aborted) return
        try {
            map.fitBounds(bbox, {padding:100, maxZoom:Math.max(11, map.getZoom())})
        } catch {}

        const source = map.getSource('placeSearch')
        if (!source) return

        source.setData(data)
        const legendControl = map._ms.controls.legend
        const layers = legendControl.addGeoJSONLayers(source.id, {
            properties: this.layerProperties ??= {
                metadata: {
                    name: 'default',
                    params: {
                        style: 'default',
                        styles: {
                            default: [
                                legendControl.getVectorGroupParams({
                                    color: `hsl(0, 100%, 50%)`
                                }),
                            ]
                        }
                    }
                }
            }
        })
    }

    onRemove() {
        this._container.parentNode.removeChild(this._container);
        this._map = undefined;
    }
}