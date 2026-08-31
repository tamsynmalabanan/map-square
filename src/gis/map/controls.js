import maplibregl from 'maplibre-gl';
import * as svg from '../../svg.js';
import FitToWorldControl from './fitToWorld.js';
import PlaceSearchControl from './placeSearch.js';
import MetadataControl from './metadata.js';
import { LegendControl } from './legend.js';
import { SettingsControl } from './settings.js';
import { FileControl } from './file.js';

export default class HandleControls {
    constructor(map) {
        this._map = map
        this.addControls()
    }

    getControlConfig(name) {
        return {
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
            },
            terrain: {
                constructor: maplibregl.TerrainControl,
                handler: (control) => {
                    const button = control.getContainer().querySelector('button')

                    control.isEnabled = () => {
                        return button.classList.contains('maplibregl-ctrl-terrain-enabled')
                    }

                    control.toggleTerrain = () => {
                        button.click()
                    }

                    button.addEventListener('click', async (e) => {
                        const map = this._map
                        const settings = map.getControls('settings')
                        if (!settings) return
                        
                        await settings.updateConfig(['settings', 'terrain'], control.isEnabled(), {theme: map.getTheme()})
                        settings.configHillshade()
                    })
                },
                elements: {
                    '.maplibregl-ctrl-terrain': {
                        innerHTML: '<span class="maplibregl-ctrl-icon dark:invert" aria-hidden="true"></span>'
                    }
                },
            },
            geolocate: {
                constructor: maplibregl.GeolocateControl,
                elements: {
                    '.maplibregl-ctrl-geolocate': {
                        innerHTML: '<span class="maplibregl-ctrl-icon dark:invert" aria-hidden="true"></span>'
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
            },
            scalebar: {
                constructor: maplibregl.ScaleControl,
                elements: {
                    '.maplibregl-ctrl-scale': {
                        addClass: ['border-gray-950/100!', 'dark:border-gray-100/100!'],
                        removeClass: ['border-1!', 'dark:border-gray-100/10!', 'border-gray-500/50!'],
                    }
                },
            },
            attribution: {
                constructor: maplibregl.AttributionControl,
                handler: (control) => {
                    utils.observeElement(control._innerContainer, (mutations, el) => {
                        Array(el.querySelectorAll('a').forEach(a => {
                            a.classList.add('dark:text-white!')
                        }))
                    })

                    control.getContainer().style.maxWidth = `70vw`
                },
                elements: {
                    '.maplibregl-ctrl-attrib': {
                    },
                    '.maplibregl-ctrl-attrib-button': {
                        addClass: ['dark:invert', 'focus:shadow-none!'],
                        classBindings: [`['enabled:hover:bg-'+color+'-500/50!']: false`]
                    },
                },
            },
            
            metadata: {
                constructor: MetadataControl,
                elements: {
                    '.maplibregl-ctrl-metadata': {},
                },
            },
            legend: {
                constructor: LegendControl,
                elements: {
                  '.maplibregl-ctrl-legend': {},
                },
            },
            placeSearch: {
                constructor: PlaceSearchControl,
                elements: {
                  '.maplibregl-ctrl-place-search': {
                  }
                },
            },
            fitToWorld: {
                constructor: FitToWorldControl,
                elements: {
                    '.maplibregl-ctrl-fit-to-world': {}
                },
            },
            file: {
                constructor: FileControl,
                elements: {
                    '.maplibregl-ctrl-file': {},
                },
            },
            settings: {
                constructor: SettingsControl,
                elements: {
                    '.maplibregl-ctrl-settings': {},
                },
            },
        }[name]
    }

    addControls() {
        const map = this._map

        this.removeControls()

        const controls = Object.fromEntries(
            Object.entries(map.getConfig().controls)
            .sort((a, b) => a[1].order - b[1].order)
            .map(([name, props]) => {
                if (!props.active) return

                const config = this.getControlConfig(name)
                if (!config) return

                const control = new config.constructor(props.options)
                this._map.addControl(control, props.position)

                const container = control._controlContainer ?? control._container
                container.classList.add('dark:text-white!')
                container.setAttribute(':class', `{
                    ['bg-'+color+'-100/100! dark:bg-'+color+'-950/100!']: true,
                }`)

                control.getContainer = () => {
                    return container
                }

                Object.entries(config.elements ??= {}).forEach(([selector, params]) => {
                    const el = container.querySelector(selector) ?? container.parentElement.querySelector(selector)
                    if(!el) return

                    if (params.innerHTML) {
                        el.innerHTML = params.innerHTML
                    }
                    
                    Array(
                        ...(el.tagName.toLowerCase() == 'button' ? [
                            `['enabled:hover:bg-'+color+'-500/50! rounded! focus:rounded! hover:rounded!']: true`,
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
                    el.classList.add('grid', 'place-items-center', 'size-[15px]!')
                })

                config.handler?.(control)

                return [name, control]
            }).filter(Boolean)
        )

        map.getControls = (name) => {
            if (name) return controls[name]
            return controls
        }
    }

    removeControls() {
        const map = this._map

        const controls = map.getControls?.() || {}
        if (Object.keys(controls).length === 0) return
        
        Object.entries(controls).forEach((name, control) => {
            map.removeControl(control)
            delete controls[name]
        })
    }
}