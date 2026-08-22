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

    getControlConfig(name) {
        return {
            nav: {
                constructor: maplibregl.NavigationControl,
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
                        const theme = map.getTheme()
                        await map.updateConfig(['settings', 'terrain'], control.isEnabled(), {theme})
                        map.getControls('settings')?.configHillshade()
                    })
                }
            },
            geolocate: {
                constructor: maplibregl.GeolocateControl,
            },
            fullscreen: {
                constructor: maplibregl.FullscreenControl,
            },
            scalebar: {
                constructor: maplibregl.ScaleControl,
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
            },
            
            metadata: {
                constructor: MetadataControl,
            },
            legend: {
                constructor: LegendControl,
            },
            placeSearch: {
                constructor: PlaceSearchControl,
            },
            fitToWorld: {
                constructor: FitToWorldControl,
            },
            save: {
                constructor: SaveControl,
            },
            settings: {
                constructor: SettingsControl
            },
        }[name]
    }

    addControls() {
        const map = this._map

        this.removeControls()

        const controls = Object.fromEntries(
            Object.entries(map.getConfig().controls).map(([name, props]) => {
                const params = this._map.getTheme().settings.controls[name] ??= props.params
                return [name, {...props, params}]
            }).sort((a, b) => a[1].params.order - b[1].params.order).map(([name, props]) => {
                const params = props.params
                if (!params.active) return

                const config = this.getControlConfig(name)
                if (!config) return

                const control = new config.constructor(params.options)
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
                    el.classList.add('grid', 'place-items-center', 'm-1', 'size-[15px]!')
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