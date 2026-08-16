import Alpine from "alpinejs";
import button from "../../templates/button.js"
import modal from '../../templates/modal.js'; 

export class SettingsControl {
    constructor(options) {
    
    }

    onAdd(map) {
        this._map = map
        
        const container = this._container = document.createElement('div')
        container.classList.add('maplibregl-ctrl','maplibregl-ctrl-group')
        container.setAttribute('x-data', 'collapseGroup')

        container.innerHTML = button({
            title: 'Legend',
            icon: svg.cog8ToothMini,
            classStr: 'maplibregl-ctrl-settings',
            attrs: `@click='toggleCollapse' x-show='collapsed'`
        })

        const content = document.createElement('div')
        content.classList.add('flex', 'flex-col')
        content.setAttribute('x-show', '!collapsed')
        content.setAttribute('@click.outside', 'closeCollapse')
        container.appendChild(content)

        const menu = document.createElement('div')
        menu.classList.add('m-1', 'flex', 'flex-col', 'gap-2')
        menu.setAttribute('x-data', `accordionGroup({value:0})`)
        content.appendChild(menu)

        this.getMenuButtons().forEach((group, groupIndex) => {
            const groupContainer = document.createElement('div')
            groupContainer.classList.add('flex', 'flex-col', 'gap-1')
            menu.appendChild(groupContainer)
            
            const header = document.createElement('div')    
            header.classList.add('flex', 'flex-nowrap', 'justify-between', 'gap-1', 'cursor-pointer')
            header.setAttribute('@click', `toggleAccordion(${groupIndex})`)
            groupContainer.appendChild(header)

            const label = document.createElement('span')
            label.innerText = group.label
            header.appendChild(label)

            const collapse = document.createElement('span')
            collapse.setAttribute('x-html', `isActiveSection(${groupIndex}) ? svg.chevronUpMini : svg.chevronDownMini`)
            header.appendChild(collapse)
            
            const buttonsContainer = document.createElement('div')
            buttonsContainer.classList.add('flex', 'flex-wrap', 'justify-items-start', 'gap-1')
            buttonsContainer.setAttribute('x-show', `isActiveSection(${groupIndex})`)
            if (group.radio) {
                buttonsContainer.setAttribute('x-data', `radioGroup({value:'${group.radio}'})`)
            }
            groupContainer.appendChild(buttonsContainer)

            group.buttons.forEach((params, btnIndex) => {
                const dynamicBtn = (
                    (!group.radio && typeof params.highlight === 'boolean')
                    ? `highlight${groupIndex}${btnIndex}`
                    : false
                )
                const menuBtn = utils.strToEl(button({
                    title: params.title,
                    icon: params.icon,
                    classStr: 'grid place-items-center border-none!',
                    ...( dynamicBtn ? {
                        attrs: `
                            x-data="highlightButton({
                                key: '${dynamicBtn}', 
                                value: ${params.highlight}
                            })" 
                            @click="toggleHighlight({targetKey: '${dynamicBtn}'})"
                        `,
                        highlightExp: dynamicBtn,
                    } : {}),
                    ...( group.radio && params.value ? {
                        attrs: `@click="toggleRadio('${params.value}')"`,
                        highlightExp: `isRadioValue('${params.value}')`,
                    } : {}),
                }))
                menuBtn.addEventListener(dynamicBtn ? 'highlightToggled' : 'click', params.handler)
                buttonsContainer.appendChild(menuBtn)
            })
        })
        
        const nav = document.createElement('div')
        nav.classList.add('grid', 'justify-items-stretch')
        content.appendChild(nav)
        
        nav.appendChild(utils.strToEl(button({
            title: 'Collapse settings',
            icon: svg.xMini,
            classStr: 'maplibregl-ctrl-close justify-self-end',
            attrs: `@click='closeCollapse' x-show='!collapsed'`
        })))
        
        map.once('load', () => {
            this.applyMapSettings()
        })
        
        return container
    }
    
    onRemove() {
        this._container.parentNode.removeChild(this._container);
        this._map = undefined;
    }
    
    getMenuButtons() {
        const map = this._map
        const settings = map._ms.theme.settings

        return [
            {
                label: 'Quick Menu',
                buttons: [
                    {
                        title: 'Toggle 3D globe',
                        icon: '🌍',
                        highlight: settings.projection === 'globe',
                        handler: (event) => {
                            const type = event.detail.value ? 'globe' : 'mercator'
                            map._ms.theme.settings.projection = type
                            map.setProjection({type})
                        },
                    },
                    {
                        title: 'Toggle basemap',
                        icon: '🗺️',
                        highlight: settings.basemap.render,
                        handler: (event) => {
                            const settings = map._ms.theme.settings
                            settings.basemap.render = !settings.basemap.render
                            this.configBasemap()
                        },
                    },
                    {
                        title: 'Toggle hillshade',
                        icon: '🏔️',
                        highlight: settings.hillshade.render,
                        handler: (event) => {
                            const settings = map._ms.theme.settings
                            settings.hillshade.render = !settings.hillshade.render
                            this.configHillshade()
                        },
                    },
                    {
                        title: 'Toggle interactivity',
                        icon: '🔒',
                        highlight: settings.locked,
                        handler: (event) => {
                            const settings = map._ms.theme.settings
                            const value = !settings.locked
                            settings.locked = value
                            value ? map.lock() : map.unlock()
                        },
                    },
                    {
                        title: 'Open settings',
                        icon: svg.cog8ToothMini,
                        highlight: null,
                        handler: (event) => {
                            console.log('open settings')
                        },
                    },
                ]
            },
            {
                label: 'Bookmark',
                buttons: [
                    {
                        title: 'Zoom to bookmarked view',
                        icon: '🔍',
                        highlight: null,
                        handler: (event) => {
                            this.goToBookmark()
                        },
                    },
                    {
                        title: 'Set new bookmarked view',
                        icon: '🔖',
                        highlight: null,
                        handler: (event) => {
                            this.updateBookmark(map.getView())
                        },
                    },
                    {
                        title: 'Toggle bookmark method',
                        icon: (
                            settings.bookmark.extents.find(i => i.active).name === 'centroid'
                            ? '📍' : '🖼️'
                        ),
                        highlight: null,
                        handler: (event) => {
                            const extents = map._ms.theme.settings.bookmark.extents
                            extents.forEach(i => i.active = !i.active)
                            event.target.innerHTML = (
                                extents.find(i => i.active).name === 'centroid'
                                ? '📍' : '🖼️'
                            )
                        },
                    },
                ]
            },
            {
                label: 'Unit of Measurement',
                radio: settings.unit,
                buttons: [{
                    title: 'Metric',
                    icon: 'km',
                    value: 'metric',
                    handler: (event) => {
                        this.configScaleBarUnit('metric')
                    },
                }, {
                    title: 'Imperial',
                    icon: 'mi',
                    value: 'imperial',
                    handler: (event) => {
                        this.configScaleBarUnit('imperial')
                    },
                }, {
                    title: 'Nautical',
                    icon: 'nm',
                    value: 'nautical',
                    handler: (event) => {
                        this.configScaleBarUnit('nautical')
                    },
                }]
            },
        ]
    }

    configScaleBarUnit(value) {
        const map = this._map
        const settings = map._ms.theme.settings
        settings.unit = value
        map._ms.controls.scalebar.setUnit(value)
    }

    goToBookmark() {
        const map = this._map
        const settings = map._ms.theme.settings
    
        if (settings.locked) return

        const bookmark = settings.bookmark
        const extent = bookmark.extents.find(i => i.active)

        if (extent.name === 'centroid') {
            map.setZoom(extent.params.zoom)
            map.setCenter(Array('lng','lat').map(i => extent.params[i]))
        } 
        
        if (extent.name === 'bbox') {
            map.fitBounds(Array('w','s','e','n').map(i => extent.params[i]), {
                padding: extent.params.padding,
                maxZoom: extent.params.maxZoom,
                duration: 0
            })
        }

        map.setPitch(bookmark.pitch)
        map.setBearing(bookmark.bearing)
    }

    updateBookmark({
        zoom,lng,lat,
        w,s,e,n,
        padding,maxZoom,
        pitch,bearing
    }={}) {
        const bookmark = map._ms.theme.settings.bookmark

        const bbox = bookmark.extents.find(i => i.name == 'bbox')
        bbox.params = {
            w: w || bbox.params.w,
            s: s || bbox.params.s,
            e: e || bbox.params.e,
            n: n || bbox.params.n,
            padding: padding || bbox.params.padding,
            maxZoom: maxZoom || bbox.params.maxZoom,
        }

        const centroid = bookmark.extents.find(i => i.name == 'centroid')
        centroid.params = {
            zoom: zoom || centroid.params.zoom,
            lng: lng || centroid.params.lng,
            lat: lat || centroid.params.lat,
        }
        
        bookmark.pitch = pitch || bookmark.pitch
        bookmark.bearing = bearing || bookmark.bearing
    }

    configHillshade(){
        const map = this._map
        const settings = map._ms.theme.settings
        const hillshade = settings.hillshade
        
        if (map.getLayer('hillshade')) {
            map.removeLayer('hillshade')
        }
 
        const source = map.getTerrain()?.source
        if (source && hillshade.render) {
            const method = hillshade.methods.find(i => i.active)
            map.addLayer({
                id: 'hillshade',
                type: 'hillshade',
                source,
                paint: {
                    'hillshade-method': method.name,
                    'hillshade-exaggeration': hillshade.exaggeration,
                    'hillshade-accent-color': hillshade.accent,
                    ...method.params
                }
            }, map._ms.controls.legend.getBeforeId('hillshade'))
        }
    }

    configBasemap() {
        const map = this._map
        
        Array('basemap', 'mask').forEach(i => {
            if (map.getLayer(i)) {
                map.removeLayer(i)
            }

            if (map.getSource(i)) {
                map.removeSource(i)
            }
        })
        
        const style = structuredClone(map.getStyle())
        if (style.sky) {
            delete style.sky
            map.setStyle(style)
        }

        const basemap = map._ms.theme.settings.basemap
        if (!basemap.render) return
        
        const theme = map.constructor.getTheme(basemap.theme)
        const paints = basemap.paints[theme]
        style.sky = paints.sky
        map.setStyle(style)
        
        const source = map._ms.config.sources.basemap
        if (source.tiles.length) {
            map.addSource('basemap', source)
            map.addLayer({
                id: 'basemap',
                type: 'raster',
                source: 'basemap',
                paint: paints.basemap
            }, map._ms.controls.legend.getBeforeId('basemap'))
        }
    }

    applyMapSettings() {
        const map = this._map
        const ms = map._ms

        document.addEventListener('darkModeToggled', (e) => {
            if (ms.theme.settings.basemap.theme !== 'auto') return
            this.configBasemap()
        })

        let sourceTimer
        Array('sourceadded', 'sourceremoved').forEach(i => {
            map.on(i, () => {
                clearTimeout(sourceTimer)
                sourceTimer = setTimeout(() => {
                    ms.config.sources = map.getStyle().sources
                }, 1000);
            })
        })

        let layerTimer
        Array('layeradded', 'layerremoved').forEach(i => {
            map.on(i, () => {
                clearTimeout(layerTimer)
                layerTimer = setTimeout(() => {
                    ms.theme.layers = map.getStyle().layers
                }, 1000);
            })
        })

        this.applyThemeSettings()
    }

    applyThemeSettings() {
        const map = this._map
        const settings = map._ms.theme.settings
        const controls = map._ms.controls

        map.setProjection({type:settings.projection})
    
        this.configScaleBarUnit(settings.unit)

        this.goToBookmark()

        this.configBasemap()

        if (settings.terrain && !controls.terrain.isEnabled()) {
            controls.terrain.toggleTerrain()
        }
            
        if (settings.locked) {
            map.lock()
        }
    }
}