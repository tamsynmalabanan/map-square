// save as new map - after saving, add get params to url, refresh page
// save existing map as new map - change id, after saving, add get params to url, refresh page
// save changes to existing map
// autosave changes

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
}