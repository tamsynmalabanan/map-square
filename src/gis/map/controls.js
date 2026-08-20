import maplibregl from 'maplibre-gl';
import * as svg from '../../svg.js';
import FitToWorldControl from './fitToWorld.js';
import PlaceSearchControl from './placeSearch.js';
import MetadataControl from './metadata.js';
import { LegendControl } from './legend.js';
import { SettingsControl } from './settings.js';
import { SaveControl } from './save.js';

export default class HandleControls {
    constructor(map) {
        this._map = map
        this.addControls()
    }

    addControls() {
        const map = this._map

        this.removeControls()

        map._ms.controls = Object.fromEntries(
            Object.entries({
                metadata: {
                    constructor: MetadataControl,
                    elements: {
                    },
                    params: {
                        active: true,
                        position: 'top-left',
                        order: 0,
                    },
                },
                legend: {
                    constructor: LegendControl,
                    elements: {
                        '.maplibregl-ctrl-legend': {},
                    },
                    params: {
                        active: true,
                        position: 'top-left',
                        order: 1,
                    },
                },
            

                placeSearch: {
                    constructor: PlaceSearchControl,
                    elements: {
                        '.maplibregl-ctrl-place-search': {
                        }
                    },
                    params: {
                        active: true,
                        position: 'top-right',
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
                        position: 'top-right',
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
                        position: 'top-right',
                        order: 3,
                        options: {
                            source:'terrain',
                            exaggeration:1,
                        },
                    },
                    handler: (control) => {
                        const button = control.getContainer().querySelector('button')
                        
                        control.isEnabled = () => {
                            return button.classList.contains('maplibregl-ctrl-terrain-enabled')
                        }

                        control.toggleTerrain = () => {
                            button.click()
                        }

                        button.addEventListener('click', (e) => {
                            const settings = map.getTheme().settings
                            settings.terrain = !settings.terrain
                            map.getControls('settings')?.configHillshade()
                        })
                        
                    }
                },
                fitToWorld: {
                    constructor: FitToWorldControl,
                    elements: {
                        '.maplibregl-ctrl-fit-to-world': {}
                    },
                    params: {
                        active: true,
                        position: 'top-right',
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
                        position: 'top-right',
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
                fullscreen: {
                    constructor: maplibregl.FullscreenControl,
                    elements: {
                        '.maplibregl-ctrl-fullscreen': {
                            innerHTML: '<span class="maplibregl-ctrl-icon dark:invert" aria-hidden="true"></span>',
                        }
                    },
                    params: {
                        active: true,
                        position: 'top-right',
                        order: 6,
                    },
                },
                
                save: {
                    constructor: SaveControl,
                    elements: {
                        '.maplibregl-ctrl-save': {},
                    },
                    params: {
                        active: true,
                        position: 'bottom-right',
                        order: 4,
                    },
                },
                settings: {
                    constructor: SettingsControl,
                    elements: {
                        '.maplibregl-ctrl-settings': {},
                    },
                    params: {
                        active: true,
                        position: 'bottom-right',
                        order: 3,
                    },
                },
                scalebar: {
                    constructor: maplibregl.ScaleControl,
                    elements: {
                        '.maplibregl-ctrl-scale': {
                            addClass: ['border-gray-950/100!', 'dark:border-gray-100/100!'],
                            removeClass: ['border-1!', 'dark:border-gray-100/10!', 'border-gray-500/50!'],
                        }
                    },
                    params: {
                        active: true,
                        position: 'bottom-right',
                        order: 2,
                        options: {
                            unit: this._map.getTheme().settings.unit,
                            maxWidth: 200,
                        }
                    },
                },
                attribution: {
                    constructor: maplibregl.AttributionControl,
                    elements: {
                        '.maplibregl-ctrl-attrib': {
                        },
                        '.maplibregl-ctrl-attrib-button': {
                            addClass: ['dark:invert', 'focus:shadow-none!'],
                            classBindings: [`['hover:bg-'+color+'-500/50!']: false`]
                        },
                    },
                    handler: (control) => {
                        utils.observeElement(control._innerContainer, (mutations, el) => {
                            Array(el.querySelectorAll('a').forEach(a => {
                                a.classList.add('dark:text-white!')
                            }))
                        })

                        control.getContainer().style.maxWidth = `70vw`
                    },
                    params: {
                        active: true,
                        position: 'bottom-right',
                        order: 1,
                        options: {
                            compact: true,
                            customAttribution: '',
                        },
                    },
                },
            }).map(([name, props]) => {
                const params = this._map.getTheme().settings.controls[name] ??= props.params
                return [name, {...props, params}]
            }).sort((a, b) => a[1].params.order - b[1].params.order).map(([name, props]) => {
                const params = props.params
                if (!params.active) return

                const control = new props.constructor(params.options)
                this._map.addControl(control, params.position)

                const container = control._controlContainer ?? control._container
                container.classList.add('dark:text-white!')
                container.setAttribute(':class', `{
                    ['bg-'+color+'-100/100! dark:bg-'+color+'-950/100!']: true,
                }`)

                control.getContainer = () => {
                    return container
                }

                Object.entries(props.elements ??= {}).forEach(([selector, params]) => {
                    const el = container.querySelector(selector) ?? container.parentElement.querySelector(selector)
                    if(!el) return

                    if (params.innerHTML) {
                        el.innerHTML = params.innerHTML
                    }
                    
                    Array(
                        ...(el.tagName.toLowerCase() == 'button' ? [
                            `['hover:bg-'+color+'-500/50! rounded! focus:rounded! hover:rounded!']: true`,
                        ] : []), 
                        ...(params.classBindings ?? [])
                    ).forEach(exp => {
                        utils.appendBinding(el, ':class', exp)
                    })
                    
                    el.classList.add(
                        'grid', 
                        'place-items-center', 
                        'dark:border-gray-100/10!', 
                        ...(params.addClass??[])
                    )

                    el.classList.remove(...(params.removeClass??[]))
                })

                Array.from(container.querySelectorAll('.maplibregl-ctrl-close')).forEach(el => {
                    el.classList.add('grid', 'place-items-center', 'm-1', 'size-[15px]!')
                })

                props.handler?.(control)

                return [name, control]
            }).filter(Boolean)
        )
    }

    removeControls() {
        const map = this._map

        const controls = map.getControls()
        if (Object.keys(controls).length === 0) return
        
        Object.values(controls).forEach(control => {
            map.removeControl(control)
        })

        map._ms.controls = {}
    }
}