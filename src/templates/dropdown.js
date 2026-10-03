import button from './button.js';

export default ({
    parent,
    title = 'Dropdown',
    icon = svg.ellipsisHorizontalMini,
    containerClassList=[],

}={}) => {
    const container = document.createElement('div')
    container.classList.add('fixed', 'z-5', ...containerClassList)
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
        'absolute', 
        // 'right-0', 
        'w-max',
        'flex', 'flex-col', 'gap-1', 
        'text-xs', 'justify-end', 
        'cursor-pointer', 
        'rounded', 'shadow-lg',
        `[&>*]:w-auto!`,
        `[&>*]:text-left!`,
        `[&>*]:border-0!`,
        `[&>*]:px-2!`,
        `[&>*]:py-1!`,
        `[&>*:first-child]:rounded-t!`,
        `[&>*:last-child]:rounded-b!`,
        `[&>*]:disabled:text-gray-600/100!`,
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

    return container
}