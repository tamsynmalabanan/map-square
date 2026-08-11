// hillshade

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
        menu.classList.add('m-1', 'flex', 'flex-wrap', 'gap-1')
        content.appendChild(menu)

        this.getMenuButtons().forEach(params => {
            const menuBtn = utils.strToEl(button({
                title: params.title,
                icon: params.icon,
                classStr: 'grid place-items-center border-none! rounded-none!',
                attrs: `x-data="dynamicBtn(active=${params.active})" @click="toggle"`,
                highlightExp: 'active',
            }))
            params.init?.(menuBtn)
            menuBtn.addEventListener('toggled', params.handler)
            menu.appendChild(menuBtn)
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
                title: 'Toggle 3D globe',
                icon: '🌍',
                active: settings.projection === 'globe',
                init: (button) => {
                    map.setProjection({type:settings.projection})
                },
                handler: (event) => {
                    const type = event.detail.active ? 'globe' : 'mercator'
                    settings.projection = type
                    map.setProjection({type})
                },
            },
            {
                title: 'Toggle hillshade',
                icon: '🏔️',
                init: (button) => {
                },
                handler: (event) => {
                    console.log('hillshade toggled')
                },
            },
            {
                title: 'Open settings',
                icon: svg.cog8ToothMini,
                init: (button) => {
                },
                handler: (button) => {
                    console.log('open settings')
                },
            },
        ]
    }
}