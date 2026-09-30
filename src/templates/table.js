import button from './button.js';

export default function table({
    parent,
    headers = {},
    sort = {
        sortOrder: 'descending'
    },
    items = [],
    btns,
    filter={
        value: ''
    },
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
    container.classList.add('size-full!', 'flex', 'flex-col', 'gap-5', 'p-3')
    parent.appendChild(container)

    const filterContainer = document.createElement('div')
    filterContainer.classList.add('flex', 'flex-nowrap', 'justify-end')
    container.appendChild(filterContainer)

    const filterInput = document.createElement('input')
    filterInput.classList.add(
        'bg-gray-200/50!', 
        'dark:bg-gray-950/50!', 
        'rounded',
        'w-1/1', 'sm:w-1/2', 'md:w-1/3', 
        'focus:outline-none', 'p-2'
    )
    filterInput.setAttribute('type', 'search')
    filterInput.setAttribute('value', filter.value)
    filterInput.setAttribute('placeholder', 'Filter table items')
    filterContainer.appendChild(filterInput)
    
    let timer
    filterInput.addEventListener('input', (e) => {
        clearTimeout(timer)
        timer = setTimeout(() => {
            const value = utils.removeWhitespace(filterInput.value)
            filter.value = value

            table({
                parent,
                headers,
                sort,
                items,
                btns,
                filter,
            })
        }, 2000)
    })

    const tableContainer = document.createElement('div')
    tableContainer.classList.add('grow', 'overflow-auto', 'min-w-[500px]', 'pe-1')
    utils.appendBinding(tableContainer , ':class', `['scrollbar-thumb-'+color+'-600/25!']: true`)
    container.appendChild(tableContainer)

    const tableEl = document.createElement('table')
    tableEl.classList.add(
        'table-auto',
        'px-3', 'pb-3',
        'w-full', 
    )
    tableContainer.appendChild(tableEl)

    const thead = document.createElement('thead')
    thead.classList.add('sticky', 'top-0')
    utils.appendBinding(thead, ':class', `['${utils.dynamicBgExp()}']: true`)
    tableEl.appendChild(thead)

    const tbody = document.createElement('tbody')
    tableEl.appendChild(tbody)

    const tHeadRow = document.createElement('tr')
    thead.appendChild(tHeadRow)

    Object.entries(headers).map(([key, title]) => {
        const td = document.createElement('td')
        td.classList.add('cursor-pointer', 'p-2')
        tHeadRow.appendChild(td)

        const tdContent = document.createElement('div')
        tdContent.classList.add('flex', 'flex-nowrap', 'gap-1', 'font-bold')
        td.appendChild(tdContent)
        
        const titleEl = document.createElement('span')
        titleEl.classList.add('self-center')
        titleEl.innerText = title
        tdContent.appendChild(titleEl)

        if (key === sort.sortBy) {
            const icon = document.createElement('span')
            icon.classList.add('self-center', 'w-[10px]')
            icon.innerHTML = sort.sortOrder === 'ascending' ? svg.chevronUpMini : svg.chevronDownMini
            tdContent.appendChild(icon)
        }

        if (sortableKeys.includes(key)) {
            td.addEventListener('click', (e) => {
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
                    filter,
                })
            })
        }

        return key
    })

    let filteredItems = utils.sortArray([...new Set(items.map(i => i[sort.sortBy]))], {
        descending: sort.sortOrder === 'descending'
    }).flatMap(i => items.filter(j => j[sort.sortBy] === i))
    
    const length = filterInput.value.length
    if (length) {
        filterInput.focus()
        filterInput.setSelectionRange(length, length)

        if (length > 2) {
            const words = filter.value.toLowerCase().split(' ').filter(Boolean)
            filteredItems = filteredItems.filter(i => {
                const str = JSON.stringify(i).toLowerCase()
                return words.every(j => str.includes(j))
            })
        }
    }

    filteredItems.forEach((item, index) => {
        const tRow = document.createElement('tr')
        tRow.classList.add('rounded', ...(index%2===0 ? ['bg-gray-200/50!','dark:bg-gray-950/50!'] : []))
        tbody.appendChild(tRow)

        keys.forEach(key => {
            const valueRaw = item[key]
            const value = valueRaw ?? typeof valueRaw === 'boolean' ? valueRaw : ''

            const isStr = typeof value === 'string'
            const isImg = isStr && value.startsWith('data:image')
            const isHTML = isStr && value.startsWith('<') && value.endsWith('>')

            const el = document.createElement('td')
            el.classList.add('p-2')
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