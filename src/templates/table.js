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
    container.classList.add(
        'grid', `grid-cols-${cols}`, 'px-3', 'pb-3',
        'max-w-full','max-h-full', 'min-w-[500px]', 'overflow-auto',
    )
    utils.appendBinding(container , ':class', `['scrollbar-thumb-'+color+'-600/25!']: true`)
    parent.appendChild(container)

    keys = Object.entries(headers).map(([key, title]) => {
        const header = document.createElement('span')
        header.classList.add(
            'flex', 'flex-nowrap', 'gap-2', 
            'justify-center',
            'text-center',
            'cursor-pointer', 
            'sticky', 'top-0', 
            'font-bold', 'p-2',
        )
        utils.appendBinding(header, ':class', `['${utils.dynamicBgExp()}']: true`)
        container.appendChild(header)
        
        const titleEl = document.createElement('span')
        titleEl.classList.add('self-center')
        titleEl.innerText = title
        header.appendChild(titleEl)

        if (key === sort.sortBy) {
            const icon = document.createElement('span')
            icon.classList.add('w-[10px]!', 'self-center')
            icon.innerHTML = sort.sortOrder === 'ascending' ? svg.chevronUpMini : svg.chevronDownMini
            header.appendChild(icon)
        }

        if (sortableKeys.includes(key)) {
            header.addEventListener('click', (e) => {
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
        keys.forEach(key => {
            let value = item[key]
            value = value ?? typeof value === 'boolean' ? value : ''

            const isStr = typeof value === 'string'
            const isImg = isStr && value.startsWith('data:image')
            const isHTML = isStr && value.startsWith('<') && value.endsWith('>')

            const tag = (
                isImg || Array('__btns__').includes(key) || headers[key] === '' || typeof value === 'object'
                ? 'div' : 'span'
            )
            
            const el = document.createElement(tag)
            el.classList.add(
                'flex', 'flex-nowrap', 'gap-3', 
                'items-center', 'justify-center', 'text-center',
                'break-all', 'p-2', index%2===0 ? 'bg-gray-950/25!' : null)
            container.appendChild(el)
            
            if (key === '__no__') {
                el.innerText = index+1
            } else if (key === '__btns__') {
                btns({item, el})
            } else if (typeof value === 'string') {
                if (isImg) {
                    const img = document.createElement('img')
                    img.classList.add('rounded', 'min-h-[50px]')
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