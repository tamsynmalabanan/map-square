
// save as new map 
// - if id already exists, change id
// - after saving, add get params to url, refresh page
// save changes to existing map
// autosave changes

import Alpine from "alpinejs";
import button from "../../templates/button.js"
import modal from '../../templates/modal.js'; 
import { values } from "lodash";
import menu from '../../templates/menu.js';
import { saveAs } from "file-saver";

export class FileControl {
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
            classStr: 'maplibregl-ctrl-file',
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
            title: 'Collapse file menu',
            icon: svg.xMini,
            classStr: 'maplibregl-ctrl-close justify-self-end',
            attrs: `@click='closeCollapse' x-show='!collapsed'`
        })))

        this.handleUpdates()
        
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
                label: 'Current',
                buttons: [
                    {
                        title: 'Save as new map',
                        icon: '💾',
                        highlight: null,
                        handler: async (event) => {
                            const config = await map.getControls('settings').updateConfig(['id'], utils.randomId())

                            const url = new URL(utils.getBaseURL(window.location.href))
                            const id = config?.id

                            if (id) {
                                url.searchParams.set('src', 'db')
                                url.searchParams.set('id', id)
                            }
                            
                            window.location.href = url.toString()
                        },
                    },
                    ...(config.id ? [
                        {
                            title: 'Save changes to map',
                            icon: `⬆️`,
                            highlight: null,
                            handler: async (event) => {
                                await map.getControls('settings').saveConfig()
                            },
                        },
                        {
                            title: 'Autosave map changes',
                            icon: `🔄️`,
                            highlight: config.autosave,
                            handler: async (event) => {
                                await map.getControls('settings').updateConfig(['autosave'], event.detail.value)
                            },
                        },
                        ...(Array('db', 'file').includes(config.src) ? [
                            {
                                title: 'Copy map URL',
                                icon: `🔗`,
                                highlight: null,
                                handler: (event) => {
                                    navigator.clipboard.writeText(window.location.href)
                                },
                            }
                        ] : [])
                    ] : [])
                ]
            },
            {
                label: 'Open',
                buttons: [
                    {
                        title: 'Open a new map',
                        icon: '➕',
                        highlight: null,
                        href: utils.getBaseURL(window.location.href)
                    },
                    {
                        title: 'Open a map file',
                        icon: '📁',
                        highlight: null,
                    },
                ]
            },
            {
                label: 'Export',
                buttons: [
                    {
                        title: 'Download Map',
                        icon: '⬇️',
                        highlight: null,
                        handler: async (event) => {
                            await this.compressMap()
                        },
                    },
                ]
            },
        ]
    }

    async compressMap() {
        const map = this._map
        const config = map.getConfig()
        const zip = new JSZip()

        zip.file("config.json", JSON.stringify(config))

        const dataFolder = zip.folder("data")
        dataFolder.file("test.geojson", JSON.stringify({
            type: "FeatureCollection",
            features: []
        }, null, 2))

        const content = await zip.generateAsync({ type: "blob" })
        const {dateCreated, title, dateUpdated} = config.metadata
        const filename = Array(
            utils.formatDate(new Date(dateCreated), {filename: true}),
            title,
            `asof${utils.formatDate(new Date(dateUpdated), {filename: true})}`,
        ).map(i => i.replaceAll(' ', '_')).join('_')

        saveAs(content, filename)
    }

    handleUpdates() {
        const map = this._map
        const config = map.getConfig()
        if (!config.id) return

        let timer
        Array('themeUpdated', 'configUpdated', 'configSaved').forEach(i => {
        clearTimeout(timer)
        setTimeout(() => {
            map.on(i, (e) => {
                const metadata = config.metadata
                const dateUpdated = new Date(metadata.dateUpdated)
                const dateSaved = new Date(metadata.dateSaved)

                // this.updatedSpan.innerHTML = `
                //     <span>${utils.formatRelativeDate(dateUpdated)}</span>
                //     <span class="italic">${dateUpdated > dateSaved ? '(unsaved)' : ''}</span>
                // `
                
                console.log(e)
            })
        }, 2000)
        })
    }
}