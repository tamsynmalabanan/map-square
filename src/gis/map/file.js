import Alpine from "alpinejs";
import button from "../../templates/button.js"
import table from "../../templates/table.js"
import modal from '../../templates/modal.js'; 
import { values } from "lodash";
import menu from '../../templates/menu.js';
import { saveAs } from "file-saver";
import Map from './map.js'

export class FileControl {
    constructor(options) {
    
    }

    onAdd(map) {
        this._map = map
        
        const container = this._container = document.createElement('div')
        container.classList.add('maplibregl-ctrl','maplibregl-ctrl-group')
        container.setAttribute('x-data', 'collapseGroup')

        container.innerHTML = button({
            title: 'File manager',
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
        
        return [
            {
                label: 'Current',
                collapsible: true,
                buttons: [
                    ...(config.id ? [
                        ...(!map.isStaticConfig() ? [
                            {
                                title: 'Autosave map changes',
                                icon: `🔄️`,
                                highlight: config.autosave,
                                handler: async (event) => {
                                    const value = event.detail.value
                                    await map.getControls('settings').updateConfig(['autosave'], value)
                                    this._container.firstElementChild.firstElementChild.nextElementSibling.innerText = value ? `🟢` : ''
                                },
                            },
                            {
                                title: 'Save changes to map',
                                icon: `⬆️`,
                                highlight: null,
                                keyboard: 'S',
                                handler: async (event) => {
                                    await map.getControls('settings').saveConfig({timeout:0})
                                },
                            },
                        ] : map.isWebConfig() ? [
                            {
                                title: 'Copy map URL',
                                icon: `🔗`,
                                highlight: null,
                                handler: (event) => {
                                    navigator.clipboard.writeText(window.location.href)
                                },
                            }
                        ] : []),
                        {
                            title: 'Refresh map',
                            icon: `🔃`,
                            highlight: null,
                            handler: async (event) => {
                                this.loadMapFromConfig(config)
                            },
                        },
                    ] : []),
                    {
                        title: 'Save as new map',
                        icon: '💾',
                        highlight: null,
                        handler: async (event) => {
                            const config = await map.getControls('settings')
                            .updateConfig(['id'], utils.randomId())
                            this.loadMapFromConfig(config)
                        },
                    },
                ]
            },
            {
                label: 'Open',
                collapsible: true,
                buttons: [
                    {
                        title: 'Open a new map',
                        icon: '➕',
                        highlight: null,
                        href: utils.getBaseURL(window.location.href)
                    },
                    {
                        init: async (btn) => {
                            const modalEl = utils.strToEl(modal({
                                open: false,
                                parent: `#${map.getContainer().id}`,
                                title: 'Local Maps',
                                icon: '🗄️',
                                origin: 'bottom.right',
                                label: false,
                                toggleClass: 'rounded!',
                            }))
                            btn.appendChild(modalEl)
                            
                            const getParent = () => document.getElementById(`${modalEl.id}-content`)
                            const headers = {
                                snapshot: '',
                                __no__: 'No.',
                                title: 'Title',
                                dateCreated: 'Created',
                                dateUpdated: 'Updated',
                                __btns__: '',
                            }
                            const sort = {
                                sortBy: 'dateCreated',
                                sortOrder: 'descending'
                            }
                            const getItems = async () => (await gisDB.getAllItemsFromGISDB('maps')).map(i => {
                                return {
                                    id: i.id,
                                    config: i,
                                    ...i.metadata,
                                }
                            })
                            const btns = ({item, el}={}) => {
                                if (item.id !== map.getConfig().id) {
                                    const openBtn = utils.strToEl(button({
                                        title: 'Open map',
                                        icon: '📂',
                                        classStr: 'size-[20px] self-center',
                                        themedBg: false,
                                    }))
                                    openBtn.addEventListener('click', (e) => {
                                        this.loadMapFromConfig(item.config)
                                    })
                                    el.appendChild(openBtn)

                                    const deleteBtn = utils.strToEl(button({
                                        title: 'Delete map',
                                        icon: '🗑️',
                                        classStr: 'size-[20px] self-center',
                                        themedBg: false,
                                    }))
                                    deleteBtn.addEventListener('click', async (e) => {
                                        gisDB.deleteFromGISDB('maps', item.id)
                                        table({
                                            parent: getParent(),
                                            headers,
                                            sort,
                                            items: await getItems(),
                                            btns,
                                        })
                                    })
                                    el.appendChild(deleteBtn)
                                }
                            }

                            modalEl.addEventListener('modalToggled', async (e) => {
                                if (!e.detail.value) return

                                table({
                                    parent: getParent(),
                                    headers,
                                    sort,
                                    items: await getItems(),
                                    btns,
                                })
                            })
                        }
                    },
                    {
                        title: 'Open a map file',
                        icon: '',
                        highlight: null,
                        init: (btn) => {
                            const label = document.createElement('label')
                            label.classList.add('cursor-pointer')
                            label.innerText = '📁'
                            btn.appendChild(label)
                            
                            const input = document.createElement('input')
                            input.classList.add('w-0', 'invisible')
                            input.setAttribute('type', 'file')
                            input.setAttribute('accept', '*.zip')
                            input.addEventListener('change', async () => {
                                const file = input.files[0]
                                if (!file) return
                                
                                const config = await this.extractMapConfig(file)
                                if (!config) return

                                this.loadMapFromConfig(config)
                            })
                            btn.appendChild(input)
                            
                            input.id = utils.randomId()
                            label.setAttribute('for', input.id)
                        }
                    },
                ]
            },
            {
                label: 'Export',
                collapsible: true,
                buttons: [
                    {
                        title: 'Download map',
                        icon: '⬇️',
                        highlight: null,
                        handler: async (event) => {
                            await this.exportMapConfig()
                        },
                    },
                ]
            }
        ]
    }

    async exportMapConfig({src='file'}={}) {
        const map = this._map
        
        const config = structuredClone(map.getConfig())
        delete config.id
        
        config.src = src
        config.autosave = false
        config.id = await utils.hashJSON(config)

        const zip = new JSZip()

        zip.file("config.json", JSON.stringify(config))

        // const dataFolder = zip.folder("data")
        // dataFolder.file("test.geojson", JSON.stringify({
        //     type: "FeatureCollection",
        //     features: []
        // }, null, 2))

        const content = await zip.generateAsync({ type: "blob" })
        
        const {dateCreated, title, dateUpdated} = config.metadata
        const filename = Array(
            utils.formatDate(new Date(dateCreated), {filename: true}),
            title, `asof${utils.formatDate(new Date(dateUpdated), {filename: true})}`,
        ).map(i => i.replaceAll(' ', '_')).join('_')

        if (src === 'file') {
            saveAs(content, filename)
        }
    }

    async extractMapConfig(file) {
        const arrayBuffer = await file.arrayBuffer()
        const zip = await JSZip.loadAsync(arrayBuffer)

        const config = JSON.parse((await zip.files['config.json']?.async('string')) ?? '{}')
        const {id, src} = config
        if (!id || !src) return

        console.log('add data to DB')
        // Object.keys(zip.files).forEach(async (filename) => {
        //     const fileObj = zip.files[filename]
        //     if (fileObj.dir) return

        //     const content = await fileObj.async("string");
        //     console.log("File:", filename);
        //     console.log("Content:", content);
        // });

        return config
    }

    loadMapFromConfig(config) {
        const {id, src} = config
        if (!id || !src) return
        
        const url = new URL(utils.getBaseURL(window.location.href))
        url.searchParams.set('src', src)
        url.searchParams.set('id', id)
        window.history.replaceState({}, '', url)

        const map = this._map
        const container = map.getContainer()
        map.remove()
        new Map(container, config)
    }

    handleUpdates() {
        const map = this._map
        const config = map.getConfig()
        
        const icon = utils.strToEl(`<span class="absolute top-0 right-0 animate-pulse"></span>`)
        this._container.firstElementChild.appendChild(icon)

        if (!config.id) {
            icon.innerText = `⚪`
            return
        } 

        if (map.isStaticConfig()) {
            icon.innerText = `🔵`
            return
        }
        
        if (config.autosave) {
            icon.innerText = `🟢`
        }

        let timer
        Array('themeupdated', 'configupdated', 'configSaved').forEach(i => {
            clearTimeout(timer)
            setTimeout(() => {
                map.on(i, async (e) => {
                    console.log(e.type, e)
                    if (e.type === "configSaved") {
                        if (config.autosave) {
                            icon.innerText = `🟢`
                        } else {
                            icon.innerText = ``
                        }
                    } else {
                        icon.innerText = `🔴`
                    }
                })
            }, 1000)
        })
    }
}