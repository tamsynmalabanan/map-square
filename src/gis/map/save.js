// save as new map 
// - if id already exists, change id
// - after saving, add get params to url, refresh page
// save changes to existing map
// autosave changes

import Alpine from "alpinejs";
import button from "../../templates/button.js"
import modal from '../../templates/modal.js'; 
import { values } from "lodash";

export class SaveControl {
    constructor(options) {
    
    }

    onAdd(map) {
        this._map = map
        
        const container = this._container = document.createElement('div')
        container.classList.add('maplibregl-ctrl','maplibregl-ctrl-group')
        container.setAttribute('x-data', 'collapseGroup')

        container.innerHTML = button({
            title: 'Save',
            icon: svg.folderMini,
            classStr: 'maplibregl-ctrl-save',
            attrs: `@click='toggleCollapse' x-show='collapsed'`
        })

        const content = document.createElement('div')
        content.classList.add('flex', 'flex-col')
        content.setAttribute('x-show', '!collapsed')
        content.setAttribute('@click.outside', 'closeCollapse')
        container.appendChild(content)

        const menu = document.createElement('div')
        menu.classList.add('m-1', 'flex', 'flex-col', 'gap-2')
        content.appendChild(menu)

        this.getMenuButtons().forEach((group, groupIndex) => {
            const groupContainer = document.createElement('div')
            groupContainer.classList.add('flex', 'flex-col', 'gap-1')
            menu.appendChild(groupContainer)
            
            const header = document.createElement('div')    
            header.classList.add('flex', 'flex-nowrap', 'justify-between', 'gap-1', 'cursor-pointer')
            groupContainer.appendChild(header)

            const label = document.createElement('span')
            label.innerText = group.label || ''
            header.appendChild(label)

            const buttonsContainer = document.createElement('div')
            buttonsContainer.classList.add('flex', 'flex-wrap', 'justify-items-start', 'gap-1')
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
                    icon: params.href ? `<a href='${params.href}' target='_blank'>${params.icon}</a>` : params.icon,
                    classStr: 'grid place-items-center border-none! rounded! focus:rounded!',
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
                    ...(group.radio && params.value ? {
                        attrs: `@click="toggleRadio('${params.value}')"`,
                        highlightExp: `isRadioValue('${params.value}')`,
                    } : {}),
                }))

                if (params.disabled) {
                    menuBtn.disabled = true
                }
                
                if (params.handler) {
                    menuBtn.addEventListener(dynamicBtn ? 'highlightToggled' : 'click', async (event) => {
                        await params.handler(event)
                    })
                }

                buttonsContainer.appendChild(menuBtn)
            })
        })
        
        const nav = document.createElement('div')
        nav.classList.add('grid', 'justify-items-stretch', 'p-1')
        content.appendChild(nav)
        
        nav.appendChild(utils.strToEl(button({
            title: 'Collapse save menu',
            icon: svg.xMini,
            classStr: 'maplibregl-ctrl-close justify-self-end',
            attrs: `@click='closeCollapse' x-show='!collapsed'`
        })))
        
        return container
    }
    
    onRemove() {
        this._container.parentNode.removeChild(this._container);
        this._map = undefined;
    }
    
    getMenuButtons() {
        const map = this._map
        const config = map.getConfig()
        const theme = map.getTheme()
        const settings = theme.settings

        return [
            {
                // label: 'Save Menu',
                buttons: [
                    {
                        title: 'Open a new map window',
                        icon: '➕',
                        highlight: null,
                        href: utils.getBaseURL(window.location.href)
                    },
                    {
                        title: 'Save as new map',
                        icon: '💾',
                        highlight: null,
                        handler: async (event) => {
                            const config = await map.updateConfig(['id'], utils.randomId())

                            const url = new URL(utils.getBaseURL(window.location.href))
                            const id = config?.id

                            if (id) {
                                url.searchParams.set('src', 'db')
                                url.searchParams.set('id', id)
                            }

                            window.location.href = url.toString()
                        },
                    },
                    {
                        title: 'Save changes to map',
                        icon: `⬆️`,
                        highlight: null,
                        disabled: !config.id,
                        handler: async (event) => {
                            await map.saveConfig()
                        },
                    },
                    {
                        title: 'Autosave map changes',
                        icon: `🔄️`,
                        highlight: config.autosave && config.id !== null,
                        disabled: !config.id,
                        handler: async (event) => {
                            await map.updateConfig(['autosave'], event.detail.value)
                        },
                    },
                ]
            },
        ]
    }
}