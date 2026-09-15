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
                            value ? this.lock() : this.unlock()
                            await this.updateConfig([
                                'settings', 
                                'locked', 
                            ], value, {theme: map.getTheme()})
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
        const systemOverlays = map.getControls('legend').getSystemOverlayNames()

        let sourceTimer
        Array('sourceadded', 'sourceremoved', 'geojsonupdated').forEach(i => {
            map.on(i, (e) => {
                if (systemOverlays.includes(e.sourceId)) return

                clearTimeout(sourceTimer)
                sourceTimer = setTimeout(async () => {
                    const sources = map.getStyle().sources
                    await this.updateConfig(['sources'], sources)
                }, 1000);
            })
        })

        let layerTimer
        Array('layeradded', 'layerremoved', 'layersreordered').forEach(i => {
            map.on(i, (e) => {
                const layerId = e.layer?.id || e.layerId
                if (systemOverlays.find(i => layerId.startsWith(i))) return
                
                clearTimeout(layerTimer)
                layerTimer = setTimeout(async () => {
                    const layers = map.getStyle().layers
                    await this.updateConfig(['layers'], layers, {theme: map.getTheme()})
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

        if (settings.colorTheme !== displaySettings.colorTheme) {
            displaySettings.changeColorTheme(settings.colorTheme)
        }

        map.setProjection({type:settings.projection})
    
        controls.zoomToBookmark.goToBookmark()

        this.configScaleBarUnit(settings.unit)
        
        this.configBasemap()

        if (settings.terrain && !controls.terrain.isEnabled()) {
            controls.terrain.toggle()
        }
        
        const systemLayers = controls.legend.getAllSystemLayerNames()
        theme.layers.forEach(layer => {
            if (systemLayers.includes(layer.id)) return
            map.addLayer(layer)  
        })
            
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

        this.getContainer().firstElementChild
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
     
        this.getContainer().firstElementChild
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

    async updateConfig(property, value, {theme}={}) {
        const map = this._map
        const config = map.getConfig()

        let target = theme || config

        property.slice(0, -1).forEach(name => {
            target = target[name]
        })

        const propertyName = property[property.length-1]
        const currentValue = target[propertyName]
        const valueChanged = !_.isEqual(currentValue, value) || (
            theme && property[0] === 'layers' 
            && utils.removeWhitespace(JSON.stringify(currentValue.map(i => i.id))) 
            !== utils.removeWhitespace(JSON.stringify(value.map(i => i.id)))
        )

        if (propertyName && valueChanged) {
            const newMap = !theme && property[0] === 'id'
            const date = (new Date()).toLocaleString("en-US")
            
            Array(config, ...(newMap ? config.themes : [theme]))
            .filter(Boolean)
            .forEach(i => {
                i.metadata.dateUpdated = date
                
                if (newMap) {
                    i.metadata.dateCreated = date
                }
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
            }

            target[propertyName] = value

            map.fire(theme ? 'themeUpdated' : 'configUpdated', {
                details: {property, value}
            })

            if (!map.isStaticConfig() && (config.autosave || property[0] === 'autosave' || newMap)) {
                await this.saveConfig({date})
            }
        }

        return theme || config
    }
}