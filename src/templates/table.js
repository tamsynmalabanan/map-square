import button from './button.js';

export default function table({
    parent,
    headers = {},
    sort = {
        sortOrder: 'descending'
    },
    items = [],
    btns,
} = {}) {
    if (!parent) return
    parent.innerHTML = ''

    let keys = Object.keys(headers)
    const cols = keys.length
    if (!cols) return

    const sortableKeys = keys.filter(key => {
        return headers[key] !== '' && !Array('__no__', '__btns__').includes(key) && typeof items[0][key] !== 'object'
    })

    if (!sort.sortBy || !sortableKeys.includes(sort.sortBy)) {
        sort.sortBy = sortableKeys[0]
    }

    const container = document.createElement('div')
    container.classList.add('flex', 'flex-col', 'gap-5', 'p-3')
    parent.appendChild(container)

    const tableEl = document.createElement('table')
    tableEl.classList.add(
        'table-auto',
        'px-3', 'pb-3',
        'max-w-full', 'max-h-full', 'min-w-[500px]', 'overflow-auto'
    )
    utils.appendBinding(tableEl , ':class', `['scrollbar-thumb-'+color+'-600/25!']: true`)
    container.appendChild(tableEl)

    const thead = document.createElement('thead')
    thead.classList.add('sticky', 'top-0')
    utils.appendBinding(thead, ':class', `['${utils.dynamicBgExp()}']: true`)
    tableEl.appendChild(thead)

    const tbody = document.createElement('tbody')
    tableEl.appendChild(tbody)

    const tHeadRow = document.createElement('tr')
    thead.appendChild(tHeadRow)

    Object.entries(headers).map(([key, title]) => {
        const headerTd = document.createElement('td')
        headerTd.classList.add('cursor-pointer', 'p-2')
        tHeadRow.appendChild(headerTd)
        
        const titleEl = document.createElement('span')
        titleEl.classList.add('self-center')
        titleEl.innerText = title
        headerTd.appendChild(titleEl)

        if (key === sort.sortBy) {
            const icon = document.createElement('span')
            icon.classList.add('self-center', 'ms-2')
            icon.innerText = sort.sortOrder === 'ascending' ? '🔼' : '🔽'
            headerTd.appendChild(icon)
        }

        if (sortableKeys.includes(key)) {
            headerTd.addEventListener('click', (e) => {
                if (key === sort.sortBy) {
                    sort.sortOrder = sort.sortOrder === 'ascending' ? 'descending' : 'ascending'
                } else {
                    sort.sortBy = key
                }
    
                table({
                    parent,
                    headers,
                    sort,
                    items,
                    btns,
                })
            })
        }

        return key
    })

    utils.sortArray([...new Set(items.map(i => i[sort.sortBy]))], {
        descending: sort.sortOrder === 'descending'
    }).flatMap(i => items.filter(j => j[sort.sortBy] === i)).forEach((item, index) => {
        const tRow = document.createElement('tr')
        tbody.appendChild(tRow)
        keys.forEach(key => {
            const valueRaw = item[key]
            const value = valueRaw ?? typeof valueRaw === 'boolean' ? valueRaw : ''

            const isStr = typeof value === 'string'
            const isImg = isStr && value.startsWith('data:image')
            const isHTML = isStr && value.startsWith('<') && value.endsWith('>')

            const el = document.createElement('td')
            el.classList.add('p-2', index%2===0 ? 'bg-gray-950/25!' : null)
            tRow.appendChild(el)
            
            if (key === '__no__') {
                el.innerText = index+1
            } else if (key === '__btns__') {
                btns({item, el, valueRaw})
            } else if (typeof value === 'string') {
                if (isImg) {
                    const img = document.createElement('img')
                    img.classList.add('rounded', 'max-w-[100px]', 'min-w-[50px]')
                    img.src = value
                    el.appendChild(img)
                } else if (isHTML) {
                    const viewBtn = utils.strToEl(button({
                        title: 'View HTML',
                        icon: '📃',
                        classStr: 'size-[20px] self-center',
                        themedBg: false,
                    }))
                    viewBtn.addEventListener('click', async (e) => {
                        const blob = new Blob([value], { type: "text/html" })
                        const url = URL.createObjectURL(blob)
                        window.open(url, "_blank")
                    })
                    el.appendChild(viewBtn)
                } else {
                    el.innerText = value
                }
            } else if (typeof value === 'object') {
                const viewBtn = utils.strToEl(button({
                    title: 'View JSON',
                    icon: '📃',
                    classStr: 'size-[20px] self-center',
                    themedBg: false,
                }))
                viewBtn.addEventListener('click', async (e) => {
                    const jsonString = JSON.stringify(value, null, 2)
                    const blob = new Blob([jsonString], { type: "application/json" })
                    const url = URL.createObjectURL(blob)
                    window.open(url, "_blank")
                })
                el.appendChild(viewBtn)
            } else {
                el.innerText = JSON.stringify(value)
            }
        })                                    
    })

    return container
}