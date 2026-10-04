import maplibregl, { Padding } from 'maplibre-gl';
import Alpine from "alpinejs";
import button from "../../templates/button.js";
import dropdown from "../../templates/dropdown.js";
import menu from '../../templates/menu.js';
import modal from '../../templates/modal.js'; 
import _, { countBy } from 'lodash';
import * as turf from '@turf/turf'

export class SettingsControl {
    constructor(options) {
        this.popups = {
            tooltip: null,
            info: null,
        }
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
                        title: 'Toggle feature tooltip',
                        icon: '💬',
                        highlight: settings.popups.tooltip.active,
                        handler: async (event) => {
                            await this.updateConfig([
                                'settings', 
                                'popups', 
                                'tooltip',
                                'active',
                            ], event.detail.value, {themeId: map.getTheme().id})
                            this.configCursor()
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
                label: 'Feature Info',
                buttons: [
                    {
                        title: 'Toggle feature info',
                        icon: 'ℹ️',
                        highlight: settings.popups.info.active,
                        handler: async (event) => {
                            await this.updateConfig([
                                'settings', 
                                'popups', 
                                'info',
                                'active',
                            ], event.detail.value, {themeId: map.getTheme().id})
                            this.configCursor()
                        },
                    },
                    {
                        title: 'Toggle layers info',
                        icon: '📚',
                        highlight: settings.popups.info.data.layers,
                        handler: async (event) => {
                            await this.updateConfig([
                                'settings', 
                                'popups', 
                                'info',
                                'data',
                                'layers',
                            ], event.detail.value, {themeId: map.getTheme().id})
                        },
                    },
                    {
                        title: 'Toggle OSM info',
                        icon: '🏠',
                        highlight: settings.popups.info.data.osm,
                        handler: async (event) => {
                            await this.updateConfig([
                                'settings', 
                                'popups', 
                                'info',
                                'data',
                                'osm',
                            ], event.detail.value, {themeId: map.getTheme().id})
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
            }, map.getControls('layers').getBeforeId('hillshade'))
        }
    }

    configBasemap() {
        const map = this._map
        const settings = map.getTheme().settings
        const basemap = settings.basemap        
        const paints = basemap.paints[Alpine.store('displaySettings').darkMode ? 'dark' : 'default']
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
            }, map.getControls('layers').getBeforeId('basemap'))
        }

        this.setSky(basemap.render ? paints.sky : null)
    }

    setSky(values) {
        const map = this._map
        const style = structuredClone(map.getStyle())
        values ? style.sky = values : style.sky ? delete style.sky : null
        map.setStyle(style)
    }

    configColorTheme() {
        const colorTheme = this._map.getTheme().settings.colorTheme
        const displaySettings = Alpine.store('displaySettings')
        if (colorTheme === displaySettings.colorTheme) return
        
        displaySettings.changeColorTheme(colorTheme)
    }

    async configMap() {
        const map = this._map

        const systemLayers = map.getControls('layers').getAllSystemLayerNames()

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
        Array('layeradded', 'layerremoved', 'layersmoved').forEach(i => {
            map.on(i, (e) => {
                const layer = e.layer
                if (systemLayers.find(i => layer.id.startsWith(i))) return
                
                clearTimeout(layerTimer)
                layerTimer = setTimeout(async () => {
                    const layers = map.getStyle().layers
                    await this.updateConfig(['layers'], layers, {
                        themeId: map.getTheme().id,
                    })
                }, 1000);
            })
        })

        let tooltipTimer
        map.on('mousemove', (e) => {
            this.clearPopup('tooltip')

            clearTimeout(tooltipTimer)
            tooltipTimer = setTimeout(async () => {
                this.popups.tooltip = await this.createTooltipPopup(e)
            }, 100)
        })
        
        let infoTimer
        map.on('click', (e) => {
            Object.keys(this.popups).forEach(i => {
                this.clearPopup(i)
            })

            clearTimeout(infoTimer)
            infoTimer = setTimeout(async () => {
                this.popups.info = await this.createInfoPopup(e)
            }, 100)
        })

        document.addEventListener('darkModeToggled', (e) => {
            this.configBasemap()
        })

        await this.applyThemeConfig()
    }

    clearPopup(name) {
        const popup = this.popups[name]
        if (!popup) return

        popup.remove()
        this.popups[name] = null

        const map = this._map
        map.getControls('layers').updateGeoJSONData({
            sourceId: name,
            features: [],
        })
        map.getControls('layers').removeSourceLayers(name)
    }

    async createTooltipPopup(e) {
        const map = this._map
        if (!map.getTheme().settings.popups.tooltip.active) return

        if (
            document.elementsFromPoint(CURSOR.x, CURSOR.y)
            .find(el => el.matches('.maplibregl-ctrl, .maplibregl-popup-content'))
        ) return

        const style = map.getStyle()
        const layers = style.layers.filter(l => {
            const sourceId = l.source
            const source = style.sources[sourceId]
            return (
                Array('geojson', 'vector').includes(source?.type)
                && l.metadata?.params?.tooltip?.active
                && source?.data?.features?.length
                && !Array('tooltip', 'info').includes(l.source)
            )
        })
        if (!layers.length) return

        const layersControl = map.getControls('layers')

        const features = await layersControl.getCanvasData({
            point: e.point, 
            layers: layers.map(l => l.id)
        })
        if (!features?.length) return

        let feature
        let label

        for (const f of features) {
            label = gisUtils.getFeatureLabel(f)
            if (!label) continue
            feature = layersControl.getRawFeature(f)
            break
        }

         if (!label) return

        layersControl.updateGeoJSONData({
            sourceId: 'tooltip',
            features: [turf.feature(feature.geometry)],
        })
        layersControl.addGeoJSONLayers('tooltip', {
            properties: layersControl.highlightedLayerProperties()
        })

        const popup = new maplibregl.Popup({closeButton: false})
        .setLngLat(e.lngLat)
        .setHTML(`<span class="break-all text-center rounded px-1! py-0! font-bold min-w-[50px] max-w-[100px]">${label}</span>`)
        .addTo(map)

        this.configPopup(popup)

        return popup
    }
    
    async createInfoPopup(e) {
        const map = this._map
        const info = map.getTheme().settings.popups.info
        if (!info.active) return

        const source = map.getSource('info')
        const layersControl = map.getControls('layers')

        let lngLat = e.lngLat

        const popup = new maplibregl.Popup({closeButton: false})
        .setLngLat(lngLat)
        .setHTML(``)
        .addTo(map)

        const controller = utils.createAbortController({
            name: 'Info popup',
            events: [[popup, ['close']]]
        })
        const {signal} = controller

        this.configPopup(popup)
    
        
        const content = document.createElement('div')
        content.classList.add('flex', 'flex-col', 'px-2', 'py-1', 'gap-3')
        popup._content.appendChild(content)

        const navBar = document.createElement('div')
        navBar.classList.add('flex', 'flex-nowrap', 'justify-between')
        content.appendChild(navBar)

        const popupLabel = document.createElement('span')
        popupLabel.innerText = 'Information'
        popupLabel.classList.add('font-bold')
        navBar.appendChild(popupLabel)

        const closeBtn = utils.strToEl(button({
            title: 'Close',
            icon: svg.xMini,
            classStr: 'size-[15px] p-0! self-center opacity-25! hover:opacity-100!',
        }))
        closeBtn.addEventListener('click', (e) => popup.remove())
        navBar.appendChild(closeBtn)

        const featuresContainer = document.createElement('div')
        const addrContainer = document.createElement('div')

        const coords = document.createElement('span')
        coords.classList.add('flex', 'flex-nowrap', 'gap-2')
        content.appendChild(coords)

        const coordsIcon = document.createElement('span')
        coordsIcon.innerText = '📍'
        coords.appendChild(coordsIcon)

        const coordsValues = ['lng', 'lat'].map(i => lngLat[i])

        const coordsSpan = document.createElement('span')
        coordsSpan.classList.add('flex', 'flex-nowrap', 'gap-2', 'grow')
        coordsSpan.innerHTML = coordsValues.map(i => `<span>${i.toFixed(6)}</span>`).join('')
        coords.appendChild(coordsSpan)

        const coordsFeature = await gisUtils.normalizeProperties(turf.point(coordsValues))
        layersControl.updateGeoJSONData({
            sourceId: 'info',
            features: [coordsFeature],
        })
        layersControl.addGeoJSONLayers('info', {
            properties: layersControl.highlightedLayerProperties()
        })

        const [coordsToggle, coordsMenu] = dropdown({
            parent: coords,
            title: 'Feature menu',
            menuClassList: ['right-1']
        }).children

        this.configInfoFeatureMenu({
            parent: coordsMenu,
            feature: coordsFeature,
            source,
        })

        if (info.data.osm) {
            const addrFeature = (await gisData.reverseSearchNominatimOSM(lngLat, {
                signal, zoom: map.getZoom()
            }))?.features?.[0]
            
            if (addrFeature) {
                content.insertBefore(addrContainer, coords)
                addrContainer.classList.add('flex', 'flex-nowrap', 'gap-2')

                const addrIcon = document.createElement('span')
                addrIcon.innerText = '🏠'
                addrContainer.appendChild(addrIcon)

                const addrSpan = document.createElement('span')
                addrSpan.innerText = addrFeature.properties.display_name
                addrSpan.classList.add('grow')
                addrContainer.appendChild(addrSpan)     
            
                layersControl.updateGeoJSONData({
                    sourceId: 'info',
                    features: [addrFeature],
                    action: 'add',
                })

                const [addrToggle, addrMenu] = dropdown({
                    parent: addrContainer,
                    title: 'Feature menu',
                    menuClassList: ['right-1']
                }).children

                this.configInfoFeatureMenu({
                    parent: addrMenu,
                    feature: addrFeature,
                    source,
                })
            }
        }

        // if (info.data.layers) {
        //     content.insertBefore(featuresContainer, content.children[0])
        // }

        return popup
    }

    configInfoFeatureMenu({parent, feature, source}={}) {
        const map = this._map

        const layersControl = map.getControls('layers')
        const isVisible = source._data.geojson.features.find(i => {
            return i.properties.__ms__.id === feature.properties.__ms__.id
        }) ? true : false

        const visibility = document.createElement('button')
        visibility.setAttribute('x-data', `{visible: ${isVisible}}`)
        visibility.setAttribute('x-text', `visible ? "Hide feature" : "Show feature"`)
        visibility.addEventListener('click', async (e) => {
            const data = Alpine.$data(visibility)
            const makeVisible = !data.visible
            data.visible = makeVisible

            layersControl.updateGeoJSONData({
                sourceId: 'info',
                features: [feature],
                action: makeVisible ? 'add' : 'remove',
            })
        })
        parent.appendChild(visibility)

        const zoomIn = document.createElement('button')
        zoomIn.innerText = 'Zoom in'
        zoomIn.setAttribute('x-bind:disabled', 'locked')
        zoomIn.addEventListener('click', async () => {
            const [w,s,e,n] = feature.bbox ?? turf.bbox(feature)
            map.fitBounds([[w,s],[e,n]], {
                padding: 100,
                maxZoom: Math.max(13, map.getZoom())
            })

        })
        parent.appendChild(zoomIn)
    }

    configPopup(popup) {
        const map = this._map

        const container = popup._container
        const content = container.querySelector('.maplibregl-popup-content')
        const tip = container.querySelector('.maplibregl-popup-tip')

        content.classList.add('p-0!', 'dark:text-white!', 'relative')
        utils.appendBinding(content, ':class', `['${utils.dynamicBgExp()}']: true`)
        
        const displaySettings = Alpine.store('displaySettings')
        const colorOptions = displaySettings.colorOptions

        const callback = (e) => {
            tip.removeAttribute('style')
            
            const {colorTheme, darkMode} = displaySettings
            const color = colorOptions[colorTheme][darkMode ? 950 : 200]
            const style = window.getComputedStyle(tip)
 
            Array('Top', 'Bottom', 'Left', 'Right').forEach(pos => {
                if (style.getPropertyValue(`border-${pos.toLowerCase()}-color`) !== `rgb(255, 255, 255)`) return
                tip.style[`border${pos}Color`] = color
            })
        }

        callback()

        map.on('move', callback)
        document.addEventListener('darkModeToggled', callback)
        document.addEventListener('colorSchemeChanged', callback)
        const containerObserver = utils.observeElement({el:container, callback, attributeFilter: ['class']})
        const contentObserver = utils.observeElement({el:content, callback, attributeFilter: ['class']})

        popup.on('close', (e) => {
            this.clearPopup(Object.keys(this.popups).find(i => this.popups[i] === popup))
          
            map.off('move', callback)
            document.removeEventListener('darkModeToggled', callback)
            document.removeEventListener('colorSchemeChanged', callback)
            containerObserver.disconnect()
            contentObserver.disconnect()
        })
    }

    async applyThemeConfig() {
        const map = this._map
        const controls = map.getControls()
        const theme = map.getTheme()
        const settings = theme.settings

        this.unlock()

        Object.keys(this.popups).forEach(i => {
            this.clearPopup(i)
        })

        map.getStyle().layers.forEach(l => {
            map.removeLayer(l.id)
        })
        
        if (controls.geolocate.isEnabled()) {
            controls.geolocate.toggle()
        }

        if (controls.terrain.isEnabled()) {
            controls.terrain.toggle()
        }

        this.goToBookmark()

        if (settings.geolocate) {
            controls.geolocate.toggle()
        }
        
        map.setProjection({type:settings.projection})
        
        if (settings.terrain !== controls.terrain.isEnabled()) {
            controls.terrain.toggle()
        }

        this.configColorTheme()
        this.configScaleBarUnit(settings.unit)
        this.configBasemap()
        
        const systemLayers = controls.layers.getAllSystemLayerNames()
        theme.layers.forEach(layer => {
            if (systemLayers.find(i => layer.id.startsWith(i))) return
            map.addLayer(layer)  
        })

        if (settings.locked) {
            this.lock()
        }

        this.configCursor()
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

        const controls = map.getControls()
        Array('nav', 'fitToWorld').forEach(i => {
            Alpine.$data(controls[i].getContainer())[`${i}Disabled`] = true
        })

        Alpine.$data(map.getContainer()).locked = true

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

        const controls = map.getControls()
        Array('nav', 'fitToWorld').forEach(i => {
            Alpine.$data(controls[i].getContainer())[`${i}Disabled`] = false
        })

        Alpine.$data(map.getContainer()).locked = false

        this.getContainer()?.firstElementChild
        .firstElementChild.nextElementSibling?.remove()
    }

    goToBookmark() {
        const map = this._map
        if (Alpine.$data(map.getContainer()).locked) return

        const {active, view, maxZoom, padding, duration} = map.getTheme().settings.bookmark

        const currentView = map.getView()
        if (_.isEqual(currentView, view)) return

        if (active === 'centroid') {
            if (currentView.zoom !== view.zoom) {
            map.setZoom(view.zoom)
            }

            if (Array('lng', 'lat').some(i => currentView[i] !== view[i])) {
            map.setCenter([view.lng, view.lat])
            }
        } 

        if (active === 'bbox') {
            const keys = Array('west','south','east','north')
            if (keys.some(i => currentView[i] !== view[i])) {
            map.fitBounds(keys.map(i => view[i]), {
                padding, maxZoom, duration,
            })
            }
        }

        if (currentView.pitch !== view.pitch) {
            map.setPitch(view.pitch)
        }

        if (currentView.bearing !== view.bearing) {
            map.setBearing(view.bearing)
        }
    }

    configCursor() {
        const map = this._map
        map.getCanvas().style.cursor = (
            Object.values(map.getTheme().settings.popups).find(i => i.active)
            ? 'pointer' : ''
        )
    }

    async saveConfig({date=(new Date()).toLocaleString("en-US"), timeout=1000}) {
        return new Promise((resolve, reject) => {
            if (this.saveTimer) {
                clearTimeout(this.saveTimer)
            }

            this.saveTimer = setTimeout(async () => {
                const map = this._map
                const config = map.getConfig()

                const snapshotPromise = Promise.race([
                    new Promise((resolve) => {
                        map.once('idle', () => {
                            config.metadata.snapshot = map.getCanvas().toDataURL('image/png')
                            map.setPixelRatio(window.devicePixelRatio)
                            resolve()
                        })
                        map.setPixelRatio(0.1)
                        map.triggerRepaint()
                    }),
                    new Promise((resolve) => setTimeout(() => resolve(), 3000))
                ]);

                await snapshotPromise
                await gisDB.saveToGISDB('maps', config)
                map.fire('configSaved', {details: {config}})

                resolve(config)
            }, timeout)
        })
    }

    async updateConfig(property, value, {
        themeId,
        event,
    }={}) {
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

const CURSOR = { x: null, y: null, }

let mousemoveTimer
document.addEventListener("mousemove", (e) => {
    clearTimeout(mousemoveTimer)
    mousemoveTimer = setTimeout(() => {
        CURSOR.x = e.clientX
        CURSOR.y = e.clientY
    }, 100)
})