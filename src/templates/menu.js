import button from './button.js';

export default (menu) => {
    const container = document.createElement('div')
    container.classList.add('m-1', 'flex', 'flex-col', 'gap-2')
    container.setAttribute('x-data', `accordionGroup({value:0})`)

    menu.forEach((group, groupIndex) => {
        const groupContainer = document.createElement('div')
        groupContainer.classList.add('flex', 'flex-col', 'gap-1')
        container.appendChild(groupContainer)
        
        const header = document.createElement('div')    
        header.classList.add('flex', 'flex-nowrap', 'justify-between', 'gap-1', 'cursor-pointer')
        header.setAttribute('@click', `toggleAccordion(${groupIndex})`)
        groupContainer.appendChild(header)

        const label = document.createElement('span')
        label.innerText = group.label || ''
        header.appendChild(label)

        const collapse = document.createElement('span')
        collapse.classList.add(
            'grid', 
            'place-items-center', 
            'rounded!', 
            'focus:rounded!', 
            'active:rounded!', 
            'size-[15px]!', 
            'opacity-25', 
            'hover:opacity-100'
        )
        collapse.setAttribute('x-html', `isActiveSection(${groupIndex}) ? svg.chevronUpMini : svg.chevronDownMini`)
        header.appendChild(collapse)
        
        const buttonsContainer = document.createElement('div')
        buttonsContainer.classList.add('grid', 'grid-cols-4', 'gap-1')
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
                icon: params.href ? `<a href='${params.href}'>${params.icon}</a>` : params.icon,
                classStr: 'grid place-items-center border-none! focus:rounded!',
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

            if (params.disabled) {
                menuBtn.disabled = true
            }

            if (params.handler) {
                menuBtn.addEventListener(dynamicBtn ? 'highlightToggled' : 'click', async (event) => {
                    try {
                        await params.handler(event)
                    } catch {
                        if (!dynamicBtn && !group.radio) return
                        const data = Alpine.$data(menuBtn)
                        data[data.key] = data.previousValue
                    }
                })
            }

            buttonsContainer.appendChild(menuBtn)
        
            if (params.init) {
                params.init(menuBtn)
            }
        })
    })

    return container
}