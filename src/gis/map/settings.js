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
            attrs: `@click='toggleCollapse' x-show='collapsed'`
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
        
        map.once('load', async () => {
            await this.applyMapSettings()
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
                            await this.updateConfig(['settings', 'projection'], type, {theme: map.getTheme()})
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
                            ], event.detail.value, {theme: map.getTheme()})
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
                            ], event.detail.value, {theme: map.getTheme()})
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
                            ], isDark, {theme: map.getTheme()})

                            this.configBasemap()
                        },
                    },
                    {
                        title: 'Toggle interactivity',
                        icon: '🔒',
                        highlight: settings.locked,
                        handler: async (event) => {
                            const value = event.detail.value
                            await this.updateConfig([
                                'settings', 
                                'locked', 
                            ], value, {theme: map.getTheme()})
                            value ? map.lock() : map.unlock()
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
                            ], active, {theme: map.getTheme()})
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
                label: 'Color Scheme',
                radio: settings.colorScheme,
                buttons: Object.entries(displaySettings.colorOptions).map(([name, hex]) => {
                    return {
                        title: utils.toTitleCase(name),
                        icon: `<div class="bg-${name}-500/100! size-[15px]! rounded!"></div>`,
                        value: name,
                        handler: async (event) => {
                            if (name !== displaySettings.colorScheme) {
                                displaySettings.changeColorScheme(name)
                            }
                            
                            await this.updateConfig([
                                'settings', 
                                'colorScheme', 
                            ], name, {theme: map.getTheme()})
                        },
                    }
                })
            },
        ]
    }

    async configScaleBarUnit(value) {
        const map = this._map
        
        map.getControls('scalebar').setUnit(value)

        await this.updateConfig([
            'settings', 
            'unit', 
        ], value, {theme: map.getTheme()})
    }

    goToBookmark() {
        const map = this._map
        const settings = map.getTheme().settings
    
        if (map._locked) return

        const bookmark = settings.bookmark
        const extent = bookmark.extents[bookmark.active]

        if (bookmark.active === 'centroid') {
            map.setZoom(extent.params.zoom)
            map.setCenter(Array('lng','lat').map(i => extent.params[i]))
        } 
        
        if (bookmark.active === 'bbox') {
            map.fitBounds(Array('w','s','e','n').map(i => extent.params[i]), {
                padding: extent.params.padding,
                maxZoom: extent.params.maxZoom,
                duration: 0
            })
        }

        map.setPitch(bookmark.pitch)
        map.setBearing(bookmark.bearing)
    }

    async updateBookmark({
        zoom,lng,lat,
        w,s,e,n,
        padding,maxZoom,
        pitch,bearing
    }={}) {
        const map = this._map
        const theme = map.getTheme()
        const bookmark = theme.settings.bookmark

        const bbox = bookmark.extents.bbox
        await this.updateConfig([
            'settings', 
            'bookmark', 
            'extents',
            'bbox',
            'params',
        ], {
            w: w || bbox.params.w,
            s: s || bbox.params.s,
            e: e || bbox.params.e,
            n: n || bbox.params.n,
            padding: padding || bbox.params.padding,
            maxZoom: maxZoom || bbox.params.maxZoom,
        }, {theme})
        
        const centroid = bookmark.extents.centroid
        await this.updateConfig([
            'settings', 
            'bookmark', 
            'extents',
            'centroid',
            'params',
        ], {
            zoom: zoom || centroid.params.zoom,
            lng: lng || centroid.params.lng,
            lat: lat || centroid.params.lat,
        }, {theme})
        
        await this.updateConfig([
            'settings', 
            'bookmark', 
            'pitch',
        ], pitch || bookmark.pitch, {theme})
        
        await this.updateConfig([
            'settings', 
            'bookmark', 
            'bearing',
        ], bearing || bookmark.bearing, {theme})
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
            }, map.getControls('legend').getBeforeId('hillshade'))
        }
    }

    configBasemap() {
        const map = this._map
        
        Array('basemap', 'mask').forEach(i => {
            if (map.getLayer(i)) {
                map.removeLayer(i)
            }
        })
        
        const style = structuredClone(map.getStyle())
        if (style.sky) {
            delete style.sky
            map.setStyle(style)
        }

        const settings = map.getTheme().settings
        const basemap = settings.basemap
        if (!basemap.render) return
        
        const theme = settings.darkMode ? 'dark' : 'default'
        const paints = basemap.paints[theme]
        style.sky = paints.sky
        map.setStyle(style)
        
        const source = map.getSource('basemap')
        if (source?.tiles?.length) {
            map.addLayer({
                id: 'basemap',
                type: 'raster',
                source: 'basemap',
                paint: paints.basemap
            }, map.getControls('legend').getBeforeId('basemap'))
        }
    }

    async applyMapSettings() {
        const map = this._map

        let sourceTimer
        Array('sourceadded', 'sourceremoved').forEach(i => {
            map.on(i, () => {
                clearTimeout(sourceTimer)
                sourceTimer = setTimeout(async () => {
                    await this.updateConfig(['sources'], map.getStyle().sources)
                }, 1000);
            })
        })

        let layerTimer
        Array('layeradded', 'layerremoved').forEach(i => {
            map.on(i, () => {
                clearTimeout(layerTimer)
                layerTimer = setTimeout(async () => {
                    await this.updateConfig(['layers'], map.getStyle().layers, {theme: map.getTheme()})
                }, 1000);
            })
        })

        await this.applyThemeSettings()
    }

    async applyThemeSettings() {
        const map = this._map
        const theme = map.getTheme()
        const settings = theme.settings
        const controls = map.getControls()

        const displaySettings = Alpine.store('displaySettings')
        
        if (settings.darkMode !== displaySettings.darkMode) {
            displaySettings.toggleDarkMode()
        }

        if (settings.colorScheme !== displaySettings.colorScheme) {
            displaySettings.changeColorScheme(settings.colorScheme)
        }

        map.setProjection({type:settings.projection})
    
        this.goToBookmark()

        await this.configScaleBarUnit(settings.unit)

        
        this.configBasemap() // suppress config update when basemap and terrain are config

        if (settings.terrain && !controls.terrain.isEnabled()) {
            controls.terrain.toggleTerrain()
        }
        
        const systemLayers = map.getControls('legend').getAllSystemLayerNames()
        theme.layers.forEach(layer => {
            if (systemLayers.includes(layer.id)) return
            map.addLayer(layer)  
        })
            
        if (settings.locked) {
            map.lock()
        }
    }

    async saveConfig(date) {
        return new Promise((resolve, reject) => {
            if (this.saveTimer) {
                clearTimeout(this.saveTimer)
            }

            this.saveTimer = setTimeout(async () => {
                const map = this._map
                const config = map.getConfig()
        
                date ??= (new Date()).toLocaleString("en-US")
                config.metadata.dateSaved = date
        
                await gisDB.saveToGISDB('maps', config)
                map.fire('configSaved', {details: {config}})

                resolve(config)
            }, 2000)
        })
    }

    async updateConfig(property, value, {theme}={}) {
        const map = this._map
        const config = map.getConfig()

        let target = theme || config

        property.slice(0, -1).forEach(name => {
            target = target[name]
        })

        const propertyName = property[property.length-1]
        const currentValue = target[propertyName]
        const valueChanged = !_.isEqual(currentValue, value)

        if (propertyName && (valueChanged || (
            theme && property[0] === 'layers' 
            && utils.removeWhitespace(JSON.stringify(currentValue)) 
            !== utils.removeWhitespace(JSON.stringify(value))
        ))) {
            const newMap = !theme && property[0] === 'id'
            const date = (new Date()).toLocaleString("en-US")
            
            Array(config, ...(newMap ? config.themes : [theme]))
            .filter(Boolean)
            .forEach(i => {
                i.metadata.dateUpdated = date
                if (!newMap) return
                i.metadata.dateCreated = date
            })

            if (newMap) {
                if (config.id && !Array('db', 'file').includes(config.src)) {
                    config.metadata.references = {
                        id: config.id,
                        src: config.src,
                        metadata: structuredClone(config.metadata)
                    }
                }

                config.src = 'db'
            }

            target[propertyName] = value

            map.fire(theme ? 'themeUpdated' : 'configUpdated', {
                details: {property, value}
            })

            if (config.autosave || property[0] === 'autosave' || newMap) {
                await this.saveConfig(date)
            }
        }

        return theme || config
    }
}