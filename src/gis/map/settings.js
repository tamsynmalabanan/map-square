import Alpine from "alpinejs";
import button from "../../templates/button.js";
import menu from '../../templates/menu.js';
import modal from '../../templates/modal.js'; 
import _ from 'lodash';

export class SettingsControl {
    constructor(options) {
    
    }

    onAdd(map) {
        this._map = map

        const container = this._container = document.createElement('div')
        container.classList.add('maplibregl-ctrl','maplibregl-ctrl-group')
        container.setAttribute('x-data', 'collapseGroup')

        container.innerHTML = button({
            title: 'Settings',
            icon: svg.cog8ToothMini,
            classStr: 'maplibregl-ctrl-settings',
            attrs: `@click='toggleCollapse' x-show='collapsed' ${map.isStaticConfig() ? 'disabled=true' : ''}`
        })

        const content = document.createElement('div')
        content.classList.add('flex', 'flex-col')
        content.setAttribute('x-show', '!collapsed')
        content.setAttribute('@click.outside', 'closeCollapse')
        container.appendChild(content)

        content.appendChild(menu(this.getMenuButtons()))

        const nav = document.createElement('div')
        nav.classList.add('grid', 'justify-items-stretch', 'p-1')
        content.appendChild(nav)
        
        nav.appendChild(utils.strToEl(button({
            title: 'Collapse settings',
            icon: svg.xMini,
            classStr: 'maplibregl-ctrl-close justify-self-end',
            attrs: `@click='closeCollapse' x-show='!collapsed'`
        })))    
        
        map.once('idle', async () => {
            await this.configMap()
        })

        map.on('configupdated', (e) => {
            if (e.details.property[0] !== 'activeTheme') return
            const container = content.firstElementChild
            container.innerHTML = ''
            menu(this.getMenuButtons(), {container})
        })
        
        return container
    }
    
    onRemove() {
        this._container.parentNode.removeChild(this._container);
        this._map = undefined;
    }
    
    getMenuButtons() {
        const map = this._map
        const settings = map.getTheme().settings
        const displaySettings = Alpine.store('displaySettings')

        return [
            {
                label: 'Quick Menu',
                buttons: [
                    {
                        title: 'Toggle 3D globe',
                        icon: '🌍',
                        highlight: settings.projection === 'globe',
                        handler: async (event) => {
                            const type = event.detail.value ? 'globe' : 'mercator'
                            map.setProjection({type})
                            await this.updateConfig(['settings', 'projection'], type, {themeId: map.getTheme().id})
                        },
                    },
                    {
                        title: 'Toggle basemap',
                        icon: '🗺️',
                        highlight: settings.basemap.render,
                        handler: async (event) => {
                            await this.updateConfig([
                                'settings', 
                                'basemap', 
                                'render'
                            ], event.detail.value, {themeId: map.getTheme().id})
                            this.configBasemap()
                        },
                    },
                    {
                        title: 'Toggle hillshade',
                        icon: '🏔️',
                        highlight: settings.hillshade.render,
                        handler: async (event) => {
                            await this.updateConfig([
                                'settings', 
                                'hillshade', 
                                'render'
                            ], event.detail.value, {themeId: map.getTheme().id})
                            this.configHillshade()
                        },
                    },
                    {
                        title: 'Toggle dark mode',
                        icon: '🌙',
                        highlight: settings.darkMode,
                        handler: async (event) => {
                            const isDark = event.detail.value
                            
                            if (isDark !== displaySettings.darkMode) {
                                displaySettings.toggleDarkMode()
                            }
                            
                            await this.updateConfig([
                                'settings', 
                                'darkMode', 
                            ], isDark, {themeId: map.getTheme().id})

                            this.configBasemap()
                        },
                    },
                    {
                        title: 'Toggle interactivity',
                        icon: '🔒',
                        highlight: settings.locked,
                        handler: async (event) => {
                            const value = event.detail.value
                            value ? this.lock() : this.unlock()
                            await this.updateConfig([
                                'settings', 
                                'locked', 
                            ], value, {themeId: map.getTheme().id})
                        },
                    },
                    {
                        title: 'Open settings',
                        icon: '⚙️',
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
                        title: 'Set new bookmarked view',
                        icon: '🔖',
                        highlight: null,
                        keyboard: 'B',
                        handler: async (event) => {
                            await this.updateConfig(
                                ['settings', 'bookmark', 'view'], 
                                map.getView(), 
                                {themeId: map.getTheme().id}
                            )
                        },
                    },
                    {
                        title: 'Toggle bookmark method',
                        icon: (
                            settings.bookmark.active === 'centroid'
                            ? '📍' : '🖼️'
                        ),
                        highlight: null,
                        handler: async (event) => {
                            const bookmark = map.getTheme().settings.bookmark
                            const active = bookmark.active === 'centroid' ? 'bbox' : 'centroid'
                            event.target.innerHTML = (
                                active === 'centroid'
                                ? '📍' : '🖼️'
                            )
                            await this.updateConfig([
                                'settings', 
                                'bookmark', 
                                'active',
                            ], active, {themeId: map.getTheme().id})
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
                    handler: async (event) => {
                        await this.configScaleBarUnit('metric')
                    },
                }, {
                    title: 'Imperial',
                    icon: 'mi',
                    value: 'imperial',
                    handler: async (event) => {
                        await this.configScaleBarUnit('imperial')
                    },
                }, {
                    title: 'Nautical',
                    icon: 'nm',
                    value: 'nautical',
                    handler: async (event) => {
                        await this.configScaleBarUnit('nautical')
                    },
                }]
            },
            {
                label: 'Color Theme',
                radio: settings.colorTheme,
                buttons: Object.entries(displaySettings.colorOptions).map(([name, hex]) => {
                    return {
                        title: utils.toTitleCase(name),
                        icon: `<div class="bg-${name}-600/100! size-[15px]! rounded!"></div>`,
                        value: name,
                        handler: async (event) => {
                            if (name !== displaySettings.colorTheme) {
                                displaySettings.changeColorTheme(name)
                            }
                            
                            await this.updateConfig([
                                'settings', 
                                'colorTheme', 
                            ], name, {themeId: map.getTheme().id})
                        },
                    }
                })
            },
        ]
    }

    async configScaleBarUnit(value) {
        const map = this._map
        const scalebar = map.getControls('scalebar')
        if (scalebar.options.unit === value) return

        map.getControls('scalebar').setUnit(value)

        await this.updateConfig([
            'settings', 
            'unit', 
        ], value, {themeId: map.getTheme().id})
    }

    configHillshade(){
        const map = this._map
        const settings = map.getTheme().settings
        const hillshade = settings.hillshade
        
        if (map.getLayer('hillshade')) {
            map.removeLayer('hillshade')
        }
 
        const source = map.getTerrain()?.source
        if (source && hillshade.render) {
            const method = hillshade.methods[hillshade.active]
            map.addLayer({
                id: 'hillshade',
                type: 'hillshade',
                source,
                paint: {
                    'hillshade-method': hillshade.active,
                    'hillshade-exaggeration': hillshade.exaggeration,
                    'hillshade-accent-color': hillshade.accent,
                    ...method.params
                }
            }, map.getControls('legend').getBeforeId('hillshade'))
        }
    }

    configBasemap() {
        const map = this._map
        const settings = map.getTheme().settings
        const basemap = settings.basemap        
        const paints = basemap.paints[settings.darkMode ? 'dark' : 'default']
        const currentBasemap = map.getLayer('basemap')
        const basemapChanged = !_.isEqual(currentBasemap?.paint?._values, paints.basemap)

        if (currentBasemap && (!basemap.render || basemapChanged)) {
            map.removeLayer('basemap')
        }

        if (basemap.render && (!currentBasemap || basemapChanged) && map.getSource('basemap')?.tiles?.length) {
            map.addLayer({
                id: 'basemap',
                type: 'raster',
                source: 'basemap',
                paint: paints.basemap
            }, map.getControls('legend').getBeforeId('basemap'))
        }

        this.setSky(basemap.render ? paints.sky : null)
    }

    setSky(values) {
        const map = this._map
        const style = structuredClone(map.getStyle())
        values ? style.sky = values : style.sky ? delete style.sky : null
        map.setStyle(style)
    }

    configDarkMode() {
        const displaySettings = Alpine.store('displaySettings')
        if (this._map.getTheme().settings.darkMode === displaySettings.darkMode) return
        
        displaySettings.toggleDarkMode()
    }

    configColorTheme() {
        const colorTheme = this._map.getTheme().settings.colorTheme
        const displaySettings = Alpine.store('displaySettings')
        if (colorTheme === displaySettings.colorTheme) return
        
        displaySettings.changeColorTheme(colorTheme)
    }

    async configMap() {
        const map = this._map
        const systemLayers = map.getControls('legend').getAllSystemLayerNames()
    
        let sourceTimer
        Array('sourceadded', 'sourceremoved', 'geojsonupdated').forEach(i => {
            map.on(i, (e) => {
                if (systemLayers.includes(e.sourceId)) return
    
                clearTimeout(sourceTimer)
                sourceTimer = setTimeout(async () => {
                    const sources = Object.fromEntries(Object.entries(structuredClone(map.getStyle().sources)).map(([id, source]) => {
                        if (source.metadata?.params?.url && source.data) {
                            delete source.data
                        }
                        return [id, source]
                    }))
                    await this.updateConfig(['sources'], sources)
                }, 1000);
            })
        })
    
        let layerTimer
        Array('layeradded', 'layerremoved', 'layersreordered').forEach(i => {
            map.on(i, (e) => {
                const layerId = e.layer?.id || e.layerId
                if (systemLayers.find(i => layerId.startsWith(i))) return
                
                clearTimeout(layerTimer)
                layerTimer = setTimeout(async () => {
                    const layers = map.getStyle().layers
                    await this.updateConfig(['layers'], layers, {themeId: map.getTheme().id})
                }, 1000);
            })
        })

        await this.applyThemeConfig()
    }

    async applyThemeConfig() {
        const map = this._map
        const controls = map.getControls()
        const theme = map.getTheme()
        const settings = theme.settings
        
        this.unlock()

        map.getStyle().layers.forEach(l => {
            map.removeLayer(l.id)
        })
        
        if (controls.geolocate.isEnabled()) {
            controls.geolocate.toggle()
        }

        controls.bookmark.goToBookmark()

        let geolocatePromise = Promise.resolve()
        if (settings.geolocate) {
            controls.geolocate.toggle()
            geolocatePromise = new Promise(resolve => {
                const finish = () => {
                    controls.geolocate.off('geolocate', finish)
                    controls.geolocate.off('error', finish)
                    resolve()
                }
                
                controls.geolocate.on('geolocate', finish)
                controls.geolocate.on('error', finish)
            })
        }
        
        map.setProjection({type:settings.projection})
        
        if (settings.terrain !== controls.terrain.isEnabled()) {
            controls.terrain.toggle()
        }

        this.configColorTheme()
        this.configDarkMode()
        this.configScaleBarUnit(settings.unit)
        this.configBasemap()
        
        const systemLayers = controls.legend.getAllSystemLayerNames()
        theme.layers.forEach(layer => {
            if (systemLayers.find(i => layer.id.startsWith(i))) return
            map.addLayer(layer)  
        })

        await geolocatePromise
        if (settings.locked) {
            this.lock()
        }
    }

    lock() {
        const map = this._map
        map.scrollZoom.disable();
        map.doubleClickZoom.disable();
        map.dragPan.disable();
        map.keyboard.disable();
        map.touchZoomRotate.disable();
        map.boxZoom.disable()
        map.dragRotate.disable()

        map._locked = true

        const controls = map.getControls()
        Array('nav', 'fitToWorld', 'bookmark').forEach(i => {
            const container = controls[i].getContainer()
            Alpine.$data(container)[`${i}Disabled`] = true
            Array.from(container.children).forEach(j => j.disabled = true)
        })

        this.getContainer()?.firstElementChild
        .appendChild(utils.strToEl(`<span class="absolute top-0 right-0">🔒</span>`))
    }
    
    unlock() {
        const map = this._map
        map.scrollZoom.enable();
        map.doubleClickZoom.enable();
        map.dragPan.enable();
        map.keyboard.enable();
        map.touchZoomRotate.enable();
        map.boxZoom.enable()
        map.dragRotate.enable()

        map._locked = false

        const controls = map.getControls()
        Array('nav', 'fitToWorld', 'bookmark').forEach(i => {
            const container = controls[i].getContainer()
            Alpine.$data(container)[`${i}Disabled`] = false
            Array.from(container.children).forEach(j => j.disabled = false)
        })

        this.getContainer()?.firstElementChild
        .firstElementChild.nextElementSibling?.remove()
    }

    async saveConfig({date=(new Date()).toLocaleString("en-US"), timeout=1000}) {
        return new Promise((resolve, reject) => {
            if (this.saveTimer) {
                clearTimeout(this.saveTimer)
            }

            this.saveTimer = setTimeout(async () => {
                const map = this._map
                const config = map.getConfig()
        
                config.metadata.dateSaved = date
        
                await gisDB.saveToGISDB('maps', config)
                map.fire('configSaved', {details: {config}})

                resolve(config)
            }, timeout)
        })
    }

    async updateConfig(property, value, {themeId}={}) {
        const map = this._map
        const config = map.getConfig()
        const theme = config.themes.find(i => i.id === themeId)
        if (themeId && !theme) return

        let target = theme || config

        property.slice(0, -1).forEach(name => {
            target = target[name]
        })

        const propertyName = property[property.length-1]
        const currentValue = target[propertyName]
        const valueChanged = !_.isEqual(currentValue, value) || (
            Array('layers', 'themes').includes(property[0])
            && utils.removeWhitespace(JSON.stringify(currentValue.map(i => i.id))) 
            !== utils.removeWhitespace(JSON.stringify(value.map(i => i.id)))
        )

        if (propertyName && valueChanged) {
            const newMap = !theme && property[0] === 'id'
            const date = (new Date()).toLocaleString("en-US")
            
            Array(config, ...(newMap ? config.themes : [theme]))
            .filter(Boolean).forEach(i => {
                i.metadata.dateUpdated = date
                if (newMap) i.metadata.dateCreated = date
            })

            if (newMap) {
                if (map.isWebConfig()) {
                    config.metadata.references = {
                        id: config.id,
                        src: config.src,
                        metadata: structuredClone(config.metadata)
                    }
                }

                config.src = 'db'
                config.autosave = false
                config.logs = []
            } else {
                (config.logs ??= []).push({
                    property, 
                    themeId,
                    date,
                    value: currentValue, 
                })
                config.logs = config.logs.slice(-100)
            }

            target[propertyName] = value

            if (!newMap) {
                map.fire(theme ? 'themeupdated' : 'configupdated', {
                    details: {property, value, themeId, date}
                })
            }

            if (!map.isStaticConfig() && (
                config.autosave || 
                property[0] === 'autosave' || 
                newMap
            )) {await this.saveConfig({date})}
        }

        return theme || config
    }
}