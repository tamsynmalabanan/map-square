import maplibregl from 'maplibre-gl';
import * as svg from '../../svg.js';
import FitToWorldControl from './fitToWorld.js';
import { PlaceSearchControl } from './placeSearch.js';

export default class HandleControls {
    constructor(map) {
        this._map = map
        this.addControls()
    }

    addControls() {
        this.removeControls()

        this._map._ms.controls = Object.fromEntries(
            Object.entries({
                placeSearch: {
                    constructor: PlaceSearchControl,
                    elements: {
                        '.maplibregl-ctrl-place-search': {}
                    },
                    params: {
                        active: true,
                        position: 'top-left',
                        order: 1,
                    },
                },
                nav: {
                    constructor: maplibregl.NavigationControl,
                    elements: {
                        '.maplibregl-ctrl-zoom-in': {
                            innerHTML: svg.plusMini,
                        },
                        '.maplibregl-ctrl-zoom-out': {
                            innerHTML: svg.minusMini,
                        },
                        '.maplibregl-ctrl-compass': {
                        },
                    },
                    params: {
                        active: true,
                        position: 'top-left',
                        order: 2,
                        options: {
                            visualizePitch: true,
                            showZoom: true,
                            showCompass: true,
                        },
                    },
                },
                terrain: {
                    constructor: maplibregl.TerrainControl,
                    elements: {
                        '.maplibregl-ctrl-terrain': {
                            innerHTML: '<span class="maplibregl-ctrl-icon dark:invert" aria-hidden="true"></span>'
                        }
                    },
                    params: {
                        active: true,
                        position: 'top-left',
                        order: 3,
                        options: {
                            source:'terrain',
                            exaggeration:1,
                        },
                    },
                },
                fitToWorld: {
                    constructor: FitToWorldControl,
                    elements: {
                        '.maplibregl-ctrl-fit-to-world': {}
                    },
                    params: {
                        active: true,
                        position: 'top-left',
                        order: 4,
                    },
                },
                geolocate: {
                    constructor: maplibregl.GeolocateControl,
                    elements: {
                        '.maplibregl-ctrl-geolocate': {
                            innerHTML: '<span class="maplibregl-ctrl-icon dark:invert" aria-hidden="true"></span>'
                        },
                    },
                    params: {
                        active: true,
                        position: 'top-left',
                        order: 5,
                        options: {
                            positionOptions: {
                                enableHighAccuracy: true
                            },
                            trackUserLocation: true,
                            showUserHeading: true,
                        },
                    },
                },
                scalebar: {
                    constructor: maplibregl.ScaleControl,
                    elements: {
                        '.maplibregl-ctrl-scale': {
                            addClass: ['border-gray-950/100!', 'dark:border-gray-100/100!'],
                            removeClass: ['border-2!', 'dark:border-gray-100/10!', 'border-gray-500/50!'],
                        }
                    },
                    params: {
                        active: true,
                        position: 'bottom-right',
                        order: 1,
                        options: {
                            unit: this._map._ms.theme.settings.unit,
                            maxWidth: 100,
                        }
                    },
                },
                fullscreen: {
                    constructor: maplibregl.FullscreenControl,
                    elements: {
                        '.maplibregl-ctrl-fullscreen': {
                            innerHTML: '<span class="maplibregl-ctrl-icon dark:invert" aria-hidden="true"></span>',
                        }
                    },
                    params: {
                        active: true,
                        position: 'bottom-right',
                        order: 3,
                    },
                },
            }).map(([name, props]) => {
                const params = this._map._ms.theme.settings.controls[name] ??= props.params
                return [name, {...props, params}]
            }).sort((a, b) => a[1].params.order - b[1].params.order).map(([name, props]) => {
                const params = props.params
                if (!params.active) return
            
                const control = new props.constructor(params.options)
                this._map.addControl(control, params.position)

                const container = control._controlContainer ?? control._container
                container.classList.add('border-2!', 'border-gray-500/50!', 'dark:text-white!')
                container.setAttribute(':class', `{['bg-'+color+'-100/100! dark:bg-'+color+'-950/100!']: true}`)

                Object.entries(props.elements ??= {}).forEach(([selector, params]) => {
                    const el = container.querySelector(selector) ?? container.parentElement.querySelector(selector)
                    if(!el) return

                    if (params.innerHTML) el.innerHTML = params.innerHTML
                    Array(`['hover:bg-'+color+'-500/50!']: true`, ...(params.classBindings??[])).forEach(exp => {
                        utils.appendBinding(el, ':class', exp)
                    })

                    el.classList.add('grid', 'place-items-center', 'dark:border-gray-100/10!', ...(params.addClass??[]))
                    el.classList.remove(...(params.removeClass??[]))
                })

                props.handler?.(control)

                return [name, control]
            }).filter(Boolean)
        )
    }

    removeControls() {
        if (Object.keys(this._map._ms.controls).length === 0) return
        
        Object.values(this._map._ms.controls).forEach(control => {
            this._map.removeControl(control)
        })

        this._map._ms.controls = {}
    }
}