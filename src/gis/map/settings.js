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
        container.setAttribute('x-data', 'toggleGroup')

        container.innerHTML = button({
            title: 'Legend',
            icon: svg.cog8ToothMini,
            classStr: 'maplibregl-ctrl-settings',
            attrs: `@click='toggle' x-show='!open'`
        })

        const content = document.createElement('div')
        content.classList.add('flex', 'flex-col')
        content.setAttribute('x-show', 'open')
        content.setAttribute('@click.outside', 'close')
        container.appendChild(content)

        const menu = document.createElement('div')
        menu.classList.add('m-1', 'flex', 'flex-col', 'gap-2')
        menu.setAttribute('x-data', `accordionGroup({activeKey:'settingsActive', activeValue:0})`)
        content.appendChild(menu)

        this.getMenuButtons().forEach((group, index) => {
            const groupContainer = document.createElement('div')
            groupContainer.classList.add('flex', 'flex-col', 'gap-1')
            menu.appendChild(groupContainer)
            
            const header = document.createElement('div')    
            header.classList.add('flex', 'flex-nowrap', 'justify-between', 'gap-1')
            header.setAttribute('@click', `toggle(${index})`)
            groupContainer.appendChild(header)

            const label = document.createElement('span')
            label.innerText = group.label
            header.appendChild(label)

            const collapse = document.createElement('span')
            collapse.setAttribute('x-html', `isActive(${index}) ? svg.chevronUpMini : svg.chevronDownMini`)
            header.appendChild(collapse)
            
            const buttonsContainer = document.createElement('div')
            buttonsContainer.classList.add('flex', 'flex-wrap', 'justify-items-start', 'gap-1')
            buttonsContainer.setAttribute('x-show', `isActive(${index})`)
            groupContainer.appendChild(buttonsContainer)

            group.buttons.forEach((params, index) => {
                const activeKey = typeof params.active === 'boolean' ? `active${index}` : false
                const menuBtn = utils.strToEl(button({
                    title: params.title,
                    icon: params.icon,
                    classStr: 'grid place-items-center border-none! rounded-none!',
                    ...( activeKey ? {
                        attrs: `x-data="dynamicBtn({
                            activeKey:'${activeKey}',
                            activeValue:${params.active}
                        })" @click="toggle"`,
                        highlightExp: activeKey,
                    } : {})
                }))
                menuBtn.addEventListener(activeKey ? 'toggled' : 'click', params.handler)
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
            attrs: `@click='toggle' x-show='open'`
        })))
        
        map.once('load', () => {
            this.applySettings()
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
                        active: settings.projection === 'globe',
                        handler: (event) => {
                            const type = event.detail.active ? 'globe' : 'mercator'
                            map._ms.theme.settings.projection = type
                            map.setProjection({type})
                        },
                    },
                    {
                        title: 'Toggle basemap',
                        icon: '🗺️',
                        active: settings.basemap.render,
                        handler: (event) => {
                            const settings = map._ms.theme.settings
                            settings.basemap.render = !settings.basemap.render
                            this.configBasemap()
                        },
                    },
                    {
                        title: 'Toggle hillshade',
                        icon: '🏔️',
                        active: settings.hillshade.render,
                        handler: (event) => {
                            const settings = map._ms.theme.settings
                            settings.hillshade.render = !settings.hillshade.render
                            this.configHillshade()
                        },
                    },
                    {
                        title: 'Open settings',
                        icon: svg.cog8ToothMini,
                        active: null,
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
                        active: null,
                        handler: (event) => {
                            // const settings = map._ms.theme.settings
                            // settings.hillshade.render = !settings.hillshade.render
                            // this.configHillshade()
                        },
                    },
                ]
            }
        ]
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

    applySettings() {
        const map = this._map
        const settings = map._ms.theme.settings
        const controls = map._ms.controls

        map.setProjection({type:settings.projection})
        
        this.configBasemap()
        document.addEventListener('darkModeToggled', (e) => {
            if (settings.basemap.theme !== 'auto') return
            this.configBasemap()
        })

        if (settings.terrain && !controls.terrain.isEnabled()) {
            controls.terrain.toggleTerrain()
        }
    }
}