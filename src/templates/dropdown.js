import button from './button.js';

export default ({
    parent,
    title = 'Dropdown',
    icon = svg.ellipsisHorizontalMini,
    menuClassList=[],
    toggleClassStr='',
    menuContent=[],
}={}) => {
    const container = document.createElement('div')
    container.setAttribute('x-data', `{showDropdown: false}`)
    parent?.appendChild(container)

    const toggle = utils.strToEl(button({
        title, icon,
        classStr: `
            size-[15px]! 
            rounded! 
            self-center 
            border-none! 
            opacity-25 
            hover:opacity-100
            cursor-pointer
            select-none
            p-0!
            ${toggleClassStr}
        `,
        minimal: true,
        attrs: `
            x-ref="dropdownToggle"
            @click='showDropdown = !showDropdown'
        `,
    }))
    container.appendChild(toggle)
    
    const menu = document.createElement('div')
    menu.classList.add(
        'fixed', 
        'z-5!', 
        'w-max',
        'right-0',
        'flex', 'flex-col',
        'text-xs', 'justify-end', 
        'cursor-pointer', 
        'rounded', 'shadow-lg',
        `[&>*]:w-auto!`,
        `[&>*]:max-w-[300px]!`,
        `[&>*]:text-left!`,
        `[&>*]:border-0!`,
        `[&>*]:px-2!`,
        `[&>*]:py-1!`,
        `[&>*:first-child]:rounded-t!`,
        `[&>*:last-child]:rounded-b!`,
        `[&>*]:disabled:text-gray-600/100!`,
        `[&>hr]:p-0!`,
        `[&>hr]:border-t-1!`,
        `[&>hr]:border-gray-600/25!`,
        ...menuClassList
    )
    menu.setAttribute('@click.outside', 'showDropdown = false')
    menu.setAttribute('@click', 'showDropdown = false')
    menu.setAttribute('x-show', 'showDropdown')
    menu.setAttribute('x-cloak', '')
    utils.appendBinding(menu, `:class`, `
        ['${utils.dynamicBgExp()}']: true,
        ['[&>*]:enabled:hover:bg-'+color+'-600/50!']: true
    `)
    container.appendChild(menu)

    menuContent.forEach((group, index) => {
        if (index !== 0) {
            const hr = document.createElement('hr')
            menu.appendChild(hr)
        }

        group.options.forEach(params => {
            const btn = document.createElement('button')
            btn.classList.add('flex', 'flex-nowrap', 'justify-between', 'gap-5')
            menu.appendChild(btn)

            Object.entries(params.attrs ?? {}).forEach(([key, value]) => {
                btn.setAttribute(key, value)
            })
            
            Object.entries(params.events ?? {}).forEach(([key, value]) => {
                btn.addEventListener(key, value)
            })
            
            if (params.innerText) {
                const label = document.createElement('span')
                label.innerText = params.innerText
                btn.appendChild(label)
            }

            params.init?.(btn)
        })
    })

    return container
}