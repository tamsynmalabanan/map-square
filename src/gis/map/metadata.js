import Alpine from 'alpinejs';
import * as svg from '../../svg.js'
import button from '../../templates/button.js';
import Map from './map.js'

export default class MetadataControl {
  onAdd(map) {
    this._map = map
    this.config = map.getConfig()
    this.metadata = this.config.metadata

    this.defaultConfig = Map.getDefaultConfig()
    this.defaultMetadata = this.defaultConfig.metadata
    this.defaultThemeMetadata = this.defaultConfig.themes[0].metadata

    this.inputSelector = 'input, textarea, label, [contenteditable], [type="editor"]'

    const container = this._container = document.createElement('div')
    container.classList.add(
      'maplibregl-ctrl', 'maplibregl-ctrl-group', 
      'sm:max-w-[80vw]', 'md:max-w-[60vw]', 'lg:max-w-[40vw]', 
    )
    container.setAttribute('x-data', 'collapseGroup({value:false})')
    
    container.innerHTML = button({
      title: 'Metadata',
      icon: svg.buildingLibraryMini,
      classStr: 'maplibregl-ctrl-metadata',
      attrs: `@click='toggleCollapse' x-show='collapsed'`
    })
    
    const inner = document.createElement('div')
    inner.classList.add('p-2', 'max-w-[80vw]', 'relative')
    inner.setAttribute('x-show', '!collapsed')
    inner.setAttribute('x-data', 'radioGroup({value:"current"})')
    container.appendChild(inner)

    this.addNavSection(inner)

    const form = this.form = document.createElement('form')
    form.classList.add('flex', 'flex-col', 'gap-2', 'grow', 'max-w-full!')
    form.addEventListener('submit', (e) => {
      e.preventDefault()
      e.stopPropagation()
    })
    inner.appendChild(form)

    this.addTitleSection(form)

    if (this.config.id) {
      const details = this.details = document.createElement('div')
      details.classList.add('flex', 'flex-col', 'gap-5', 'overflow-auto', 'max-h-[80vh]', 'pe-2')
      details.setAttribute('x-data', '{show:true}')
      details.setAttribute('x-show', 'show')
      form.appendChild(details)

      const createdSpan = document.createElement('span')
      createdSpan.classList.add('font-thin!', 'text-xs!', 'opacity-50', 'italic')
      createdSpan.innerText = `${utils.formatDate(new Date(this.metadata.dateCreated), {time:true})}`  
      details.appendChild(createdSpan)

      this.addDescriptionSection(details)
      this.addThemesSection(details)
      this.addAttrSection(details)
      this.addAcknowledgementsSection(details)
      this.addReferenceSection(details)
    }

    this.configInputElements(form)

    return container
  }

  configInputElements(parent) {
    parent.querySelectorAll(this.inputSelector).forEach(i => {
      i.classList.add('focus:outline-none', 'rounded!')
      
      if (!i.getAttribute('contenteditable')) {
        i.setAttribute('readonly', 'true')
      }

      utils.appendBinding(i, ':class', `
        ['bg-'+color+'-600/25! ${i.tagName === 'LABEL' ? '' : 'p-2!'}']: isRadioValue("edit")
      `)
    })

    parent.querySelectorAll('.overflow-auto').forEach(i => {
      utils.appendBinding(i , ':class', `['scrollbar-thumb-'+color+'-600/25!']: true`)
    })

    parent.querySelectorAll('span[contenteditable]').forEach(element => {
      element.classList.add(
        'max-h-[20vh]',
        'overflow-auto',
        'break-normal', 
        'text-wrap', 
        'text-[12px]',
        'grow',
      )
    })
  }

  addNavSection(parent) {
    const nav = this.nav = document.createElement('div')
    nav.classList.add('flex', 'flex-nowrap', 'gap-2', 'absolute', 'right-0', 'm-1', 'top-0')
    parent.appendChild(nav)

    let editBtn, backBtn, saveBtn, collapseBtn
    
    if (!this._map.isStaticConfig()) {
      editBtn = utils.strToEl(button({
        title: 'Edit metadata',
        icon: svg.pencilSquareMini,
        attrs: `@click='toggleRadio("edit")' x-show='isRadioValue("current")'`
      }))
      editBtn.addEventListener('click', () => {
        this.form.querySelectorAll(this.inputSelector).forEach(i => {
          if (i.getAttribute('contenteditable')) {
            i.setAttribute('contenteditable', "true")
          } else if (i.getAttribute('type') === 'editor') {
            Quill.find(i.querySelector('.ql-container')).enable(true)
          } else {
            i.removeAttribute('readonly')
          }
        })
      })
      nav.appendChild(editBtn)

      backBtn = utils.strToEl(button({
          title: 'Go back',
          icon: svg.arrowUturnLeftMini,
          attrs: `@click='toggleRadio("current")' x-show='isRadioValue("edit")'`
      }))
      backBtn.addEventListener('click', () => {
        this.form.querySelectorAll(this.inputSelector).forEach(i => {
          const rawName = i.getAttribute('name')
          if (!rawName) return

          const [name, themeId] = rawName.split('_')
          const theme = themeId && this.config.themes.find(theme => theme.id === themeId)
          if (themeId && !theme) return

          const metadata = theme?.metadata || this.metadata
          if (!(name in metadata)) return

          const type = i.getAttribute('type')
          const target = this.form.querySelector(`[name="${rawName}"]:not(input):not([type="editor"])`)
          const value = metadata[name]
  
          if (type === 'editor') {
            const quill = Quill.find(i.querySelector('.ql-container'))
            quill.root.innerHTML = value
            quill.enable(false)
          } else if (i.getAttribute('contenteditable')) {
            i.setAttribute('contenteditable', 'false')
            i.innerHTML = value
          } else {
            i.setAttribute('readonly', 'true')
            i.value = type === 'file' ? '' : value
            
            if (type === 'file') {
              target.src = value
            }
          }
  
        })

        Alpine.$data(this.themesContainer).activeTheme = this.config.activeTheme

        const themeIds = this.config.themes.map(i => i.id)
        const sortItems = Object.fromEntries(
          Array.from(this.themesContainer.children)
          .map(i => [i.getAttribute('x-sort:item'), i])
        )
        if (themeIds.join('') !== Object.keys(sortItems).join('')) {
          themeIds.forEach(i => this.themesContainer.appendChild(sortItems[i]))
        }
      })
      nav.appendChild(backBtn)

      saveBtn = utils.strToEl(button({
          title: 'Save changes',
          icon: svg.checkCircleMini,
          attrs: `@click='toggleRadio("current")' x-show='isRadioValue("edit")'`
      }))
      saveBtn.addEventListener('click', async () => {
        const settings = this._map.getControls('settings')

        for (const i of this.form.querySelectorAll(this.inputSelector)) {
          const editableContent = i.getAttribute('contenteditable')
    
          if (editableContent) {
            i.setAttribute('contenteditable', 'false')
          } else {
            i.setAttribute('readonly', 'true')
          }

          const rawName = i.getAttribute('name')
          if (!rawName) continue

          const [name, themeId] = rawName.split('_')
          const theme = themeId && this.config.themes.find(theme => theme.id === themeId)
          if (themeId && !theme) continue

          const metadata = theme?.metadata || this.metadata
          if (!(name in metadata)) continue

          const defaultMetadata = theme ? this.defaultThemeMetadata : this.defaultMetadata
          
          const type = i.getAttribute('type')
          const target = this.form.querySelector(`[name="${rawName}"]:not(input):not([type="editor"])`)
          let value = editableContent ? i.innerHTML : i.value
          
          if (type === 'editor') {
            const quill = Quill.find(i.querySelector('.ql-container'))
            value = quill.root.textContent ? quill.root.innerHTML : ''
            quill.enable(false)
          } else if (type === 'file') {
            i.value = ''
            if (i.getAttribute('accept') === 'image/*') {
              value = target.src
            }
          } else if (typeof value === 'string') {
            value = utils.removeWhitespace(value)
  
            if (editableContent && i.textContent === '') {
              i.innerHTML = value = defaultMetadata[name]            
            }
    
            if (type === 'url') {
              target.href = value
              target.innerText = utils.getBaseURL(value)
            }
  
            if (type === 'email') {
              target.href = `mailto:${value}`
              target.innerText = value
            }
          }
    
          if (value === metadata[name]) continue
          settings.updateConfig(['metadata', name], value, {themeId})
        }

        const newActiveTheme = Alpine.$data(this.themesContainer).activeTheme
        if (newActiveTheme !== this.config.activeTheme) {
          await settings.updateConfig(['activeTheme'], newActiveTheme)
          await settings.applyThemeConfig()
        }

        const themes = Object.fromEntries(this.config.themes.map(i => [i.id, i]))
        const sortedThemeIds = Array.from(this.themesContainer.children).map(i => i.getAttribute('x-sort:item'))
        if (sortedThemeIds.join('') !== Object.keys(themes).join('')) {
          await settings.updateConfig(['themes'], sortedThemeIds.map(i => themes[i]))
        }
      })
      nav.appendChild(saveBtn)
    }
    
    if (this.config.id) {
      collapseBtn = utils.strToEl(button({
        title: 'Toggle details',
        icon: svg.chevronUpMini,
        attrs: `x-ref="collapseBtn"`
      }))
      collapseBtn.addEventListener('click', () => {
        const data = Alpine.$data(this.details)
        data.show = !data.show
        collapseBtn.innerHTML = data.show ? svg.chevronUpMini : svg.chevronDownMini
      })
      nav.appendChild(collapseBtn)
    }

    nav.appendChild(utils.strToEl(button({
      title: 'Collapse metadata',
      icon: svg.xMini,
      classStr: 'maplibregl-ctrl-close',
      attrs: `@click='toggleCollapse'  x-show='isRadioValue("current")'`
    })))

    Array(editBtn, saveBtn, backBtn, collapseBtn).filter(Boolean).forEach(i => {
      i.classList.add(
        'grid', 
        'place-items-center', 
        'rounded!', 
        'focus:rounded!', 
        'active:rounded!', 
        'size-[15px]!', 
        'opacity-25', 
        'hover:opacity-100'
      )
    })
  }

  addTitleSection(parent) {
    const container = document.createElement('div')
    container.classList.add('flex', 'flex-col', 'gap-2', 'grow', 'max-w-full!')
    parent.appendChild(container)

    const titleInput = document.createElement('span')
    titleInput.innerHTML = this.metadata.title
    titleInput.setAttribute('name', 'title')
    titleInput.setAttribute('contenteditable', "false")
    titleInput.classList.add(
      'min-w-[20vw]',
      'max-w-[80vw]',
      'overflow-auto', 
      'font-bold!',
      'text-xl!',
    )
    container.appendChild(titleInput)
  }

  addLogoSection(parent) {
    const logoForm = document.createElement('div')
    logoForm.classList.add('flex', 'flex-col', 'gap-2')
    parent.appendChild(logoForm)

    const logoImg = document.createElement('img')
    logoImg.classList.add('size-[10vh]', 'rounded')
    logoImg.src = this.metadata.logo
    logoImg.setAttribute('name', 'logo')
    logoImg.setAttribute('x-data', `{show: $el.src !== "${this.defaultMetadata.logo}"}`)
    logoImg.setAttribute('x-show', `isRadioValue("edit") || show`)
    logoForm.appendChild(logoImg)

    const logoInputs = document.createElement('div')
    logoInputs.classList.add('flex', 'flex-nowrap', 'gap-1')
    logoInputs.setAttribute('x-show', 'isRadioValue("edit")')
    logoForm.appendChild(logoInputs)

    const logoInputContainer = document.createElement('div')
    logoInputContainer.classList.add('grow')
    logoInputs.appendChild(logoInputContainer)

    const logoLabel = document.createElement('label')
    logoLabel.innerText = '📁'
    logoLabel.setAttribute('title', 'Select an image')
    logoLabel.className = `w-7vh flex justify-center items-center gap-2 rounded py-1 px-2 dark:text-white cursor-pointer grow`
    logoInputContainer.appendChild(logoLabel)
    
    const logoInput = document.createElement('input')
    logoInput.id = utils.randomId()
    logoLabel.setAttribute('for', logoInput.id)
    logoInput.classList.add('w-0', 'invisible')
    logoInput.setAttribute('type', 'file')
    logoInput.setAttribute('name', 'logo')
    logoInput.setAttribute('accept', 'image/*')
    logoInput.addEventListener('change', async () => {
      const file = logoInput.files[0]
      logoImg.src = file ? await utils.fileToDataURL(file) : this.defaultMetadata.logo
    })
    logoInputContainer.appendChild(logoInput)

    const removeLogoBtn = utils.strToEl(button({
      icon: '🗑️',
      title: 'Remove current image',
      highlightExp: true,
    }))
    removeLogoBtn.addEventListener('click', () => {
      logoInput.value = ''
      logoInput.dispatchEvent(new CustomEvent("change"))
    })
    logoInputs.appendChild(removeLogoBtn)
  }

  addAttrSection(parent) {
    const container = document.createElement('div')
    container.classList.add('flex', 'flex-col', 'gap-1')
    container.setAttribute('x-data', '{show:true}')
    parent.appendChild(container)

    const header = document.createElement('span')
    header.classList.add('flex', 'flex-nowrap', 'justify-between', 'align-middle', 'font-bold')
    container.appendChild(header)

    const label = document.createElement('span')
    label.innerText = 'Attribution'
    header.appendChild(label)

    const collapse = document.createElement('span')
    collapse.classList.add('size-[15px]!', 'self-center', 'cursor-pointer', 'opacity-25', 'hover:opacity-100')
    collapse.setAttribute('x-html', 'show ? svg.chevronUpMini : svg.chevronDownMini')
    collapse.setAttribute('@click', 'show=!show')
    header.appendChild(collapse)

    const content = document.createElement('div')
    content.classList.add('flex', 'flex-nowrap', 'gap-2')
    content.setAttribute('x-show', 'show')
    container.appendChild(content)

    this.addLogoSection(content)

    const attrContainer = document.createElement('div')
    attrContainer.classList.add('flex', 'flex-col', 'gap-1', 'grow')
    content.appendChild(attrContainer)

    const creatorContainer = document.createElement('div')
    creatorContainer.classList.add('flex', 'flex-nowrap', 'gap-1')
    attrContainer.appendChild(creatorContainer)

    const creatorSpan = document.createElement('span')
    creatorSpan.innerText = `Creator`  
    creatorContainer.appendChild(creatorSpan)

    const creatorInput = document.createElement('span')
    creatorInput.innerHTML = this.metadata.creator
    creatorInput.setAttribute('name', 'creator')
    creatorInput.setAttribute('contenteditable', "false")
    creatorContainer.appendChild(creatorInput)

    const websiteContainer = document.createElement('div')
    websiteContainer.classList.add('flex', 'flex-nowrap', 'gap-1')
    websiteContainer.setAttribute('x-show', 'isRadioValue("edit") || $refs.websiteInput.value !== ""')
    attrContainer.appendChild(websiteContainer)

    const websiteSpan = document.createElement('span')
    websiteSpan.innerText = `Website`  
    websiteContainer.appendChild(websiteSpan)

    const websiteInput = document.createElement('input')
    websiteInput.value = this.metadata.website
    websiteInput.classList.add('grow')
    websiteInput.setAttribute('placeholder', 'https://www.your-website.com')
    websiteInput.setAttribute('type', 'url')
    websiteInput.setAttribute('name', 'website')
    websiteInput.setAttribute('readonly', 'true')
    websiteInput.setAttribute('x-show', 'isRadioValue("edit")')
    websiteInput.setAttribute('x-ref', 'websiteInput')
    websiteContainer.appendChild(websiteInput)

    const websiteCurrent = document.createElement('a')
    websiteCurrent.innerHTML = utils.getBaseURL(this.metadata.website)
    websiteCurrent.setAttribute('name', 'website')
    websiteCurrent.setAttribute('href', this.metadata.website)
    websiteCurrent.setAttribute('target', '_blank')
    websiteCurrent.setAttribute('x-show', 'isRadioValue("current")')
    websiteContainer.appendChild(websiteCurrent)

    const emailContainer = document.createElement('div')
    emailContainer.classList.add('flex', 'flex-nowrap', 'gap-1')
    emailContainer.setAttribute('x-show', 'isRadioValue("edit") || $refs.emailInput.value !== ""')
    attrContainer.appendChild(emailContainer)

    const emailSpan = document.createElement('span')
    emailSpan.innerText = `Email`  
    emailContainer.appendChild(emailSpan)

    const emailInput = document.createElement('input')
    emailInput.value = this.metadata.email
    emailInput.classList.add('grow')
    emailInput.setAttribute('placeholder', 'your@email.com')
    emailInput.setAttribute('type', 'email')
    emailInput.setAttribute('name', 'email')
    emailInput.setAttribute('readonly', 'true')
    emailInput.setAttribute('x-show', 'isRadioValue("edit")')
    emailInput.setAttribute('x-ref', 'emailInput')
    emailContainer.appendChild(emailInput)

    const emailCurrent = document.createElement('a')
    emailCurrent.innerHTML = this.metadata.email
    emailCurrent.setAttribute('name', 'email')
    emailCurrent.setAttribute('href', `mailto:${this.metadata.email}`)
    emailCurrent.setAttribute('target', '_blank')
    emailCurrent.setAttribute('x-show', 'isRadioValue("current")')
    emailContainer.appendChild(emailCurrent)

    const licenseContainer = document.createElement('div')
    licenseContainer.classList.add('flex', 'flex-nowrap', 'gap-1')
    attrContainer.appendChild(licenseContainer)
    
    const licenseIcon = document.createElement('span')
    licenseIcon.innerText = `License`  
    licenseContainer.appendChild(licenseIcon)
    
    const licenseInput = document.createElement('span')
    licenseInput.innerHTML = this.metadata.license
    licenseInput.setAttribute('name', 'license')
    licenseInput.setAttribute('contenteditable', "false")
    licenseContainer.appendChild(licenseInput)

    content.querySelectorAll('span:not([contenteditable])').forEach(i => {
      i.classList.add('w-[45px]', 'opacity-50', 'self-center')
    })
  }

  addAcknowledgementsSection(parent) {
    const container = document.createElement('div')
    container.classList.add('flex', 'flex-col', 'gap-1')
    container.setAttribute('x-show', 'isRadioValue("edit") || $refs.acknowledgementsInput.innerText !== ""')
    container.setAttribute('x-data', '{show:true}')
    parent.appendChild(container)

    const header = document.createElement('span')
    header.classList.add('flex', 'flex-nowrap', 'justify-between', 'align-middle', 'font-bold')
    container.appendChild(header)

    const label = document.createElement('span')
    label.innerText = 'Acknowledgements'
    header.appendChild(label)

    const collapse = document.createElement('span')
    collapse.classList.add('size-[15px]!', 'self-center', 'cursor-pointer', 'opacity-25', 'hover:opacity-100')
    collapse.setAttribute('x-html', 'show ? svg.chevronUpMini : svg.chevronDownMini')
    collapse.setAttribute('@click', 'show=!show')
    header.appendChild(collapse)

    const acknowledgementsContainer = document.createElement('div')
    acknowledgementsContainer.classList.add('flex', 'flex-nowrap', 'gap-1')
    acknowledgementsContainer.setAttribute('x-show', 'show')
    container.appendChild(acknowledgementsContainer)

    const acknowledgementsInput = document.createElement('span')
    acknowledgementsInput.innerHTML = this.metadata.acknowledgements
    acknowledgementsInput.classList.add('grow')
    acknowledgementsInput.setAttribute('name', 'acknowledgements')
    acknowledgementsInput.setAttribute('x-ref', 'acknowledgementsInput')
    acknowledgementsInput.setAttribute('contenteditable', "false")
    acknowledgementsContainer.appendChild(acknowledgementsInput)
  }

  addDescriptionSection(parent) {
    const container = document.createElement('div')
    container.classList.add('flex', 'flex-col', 'gap-1')
    container.setAttribute('x-show', 'isRadioValue("edit") || $refs.descriptionInput.textContent !== ""')
    container.setAttribute('x-data', '{show:true}')
    parent.appendChild(container)

    const header = document.createElement('span')
    header.classList.add('flex', 'flex-nowrap', 'justify-between', 'align-middle', 'font-bold')
    container.appendChild(header)

    const label = document.createElement('span')
    label.innerText = 'Description'
    header.appendChild(label)

    const collapse = document.createElement('span')
    collapse.classList.add('size-[15px]!', 'self-center', 'cursor-pointer', 'opacity-25', 'hover:opacity-100')
    collapse.setAttribute('x-html', 'show ? svg.chevronUpMini : svg.chevronDownMini')
    collapse.setAttribute('@click', 'show=!show')
    header.appendChild(collapse)

    const descInput = document.createElement('div')
    descInput.setAttribute('type', 'editor')
    descInput.setAttribute('name', 'description')
    descInput.setAttribute('x-show', 'show')
    descInput.setAttribute(':class', `{
      ['scrollbar-thumb-'+color+'-600/25!']: true  
    }`)
    container.appendChild(descInput)

    const descQuill = document.createElement('div')
    descQuill.innerHTML = this.metadata.description
    descInput.appendChild(descQuill)
    new Quill(descQuill, {theme: 'snow', readOnly: true})

    Array.from(descInput.children).forEach(i => {
      i.classList.add('border-none!')
    })

    const descEditor = descInput.querySelector('.ql-editor')
    descEditor.classList.add('p-0!')
    descEditor.setAttribute('x-ref', 'descriptionInput')
    utils.appendBinding(descEditor, ':class', `
      ['min-h-[20vh]']: isRadioValue("edit")
    `)
    
    const descToolbar = descInput.querySelector('.ql-toolbar')
    descToolbar.setAttribute('x-show', 'isRadioValue("edit")')
    utils.appendBinding(descToolbar.querySelector('.ql-picker-options'), ':class', `
      ['bg-'+color+'-200/50! dark:bg-'+color+'-950/50!']: true
    `)
  }
  
  addThemesSection(parent) {
    const container = this.themesContainer = document.createElement('div')
    container.classList.add('flex', 'flex-col', 'gap-1')
    container.setAttribute('x-data', `{show:true, activeTheme:'${this.config.activeTheme}'}`)
    parent.appendChild(container)
  
    const header = document.createElement('span')
    header.classList.add('flex', 'flex-nowrap', 'justify-between', 'align-middle', 'font-bold', 'gap-1')
    container.appendChild(header)
  
    const label = document.createElement('span')
    label.classList.add('grow!')
    label.innerText = 'Themes'
    header.appendChild(label)
  
    const navBtns = Object.fromEntries(Object.entries({
      first: {
        title: 'Go to first theme',
        icon: svg.chevronDoubleLeftMini,
      },
      previous: {
        title: 'Go to previous theme',
        icon: svg.chevronLeftMini,
      },
      next: {
        title: 'Go to next theme',
        icon: svg.chevronRightMini,
      },
      last: {
        title: 'Go to last theme',
        icon: svg.chevronDoubleRightMini,
      },
    }).map(([name, params]) => {
      params.isDisabled = Array('first', 'previous').includes(name) ? () => {
        return this.config.activeTheme === this.config.themes[0].id
      } : () => {
        const themes = this.config.themes
        return this.config.activeTheme === themes[themes.length-1].id
      }

      const btn = params.btn = utils.strToEl(button({
        title: params.title,
        icon: params.icon,
        classStr: 'size-[15px]! self-center border-none! opacity-25 hover:opacity-100',
        minimal: true,
        attrs: `x-data='{disabled:${params.isDisabled()}}' x-show='isRadioValue("current") && !disabled'}`,
      }))
      btn.addEventListener('click', async (e) => {
        const themes = this.config.themes
        
        let theme
        if (name === 'first') {
          theme = themes[0]
        } else if (name === 'last') {
          theme = themes[themes.length-1]
        } else {
          let index = themes.findIndex(i => i.id === this.config.activeTheme)
          index = name === 'previous' ? Math.max(index-1, 0) : Math.min(index+1, themes.length-1)
          theme = themes[index]
        }

        if (!theme || theme.id === this.config.activeTheme) return
        Alpine.$data(container).activeTheme = theme.id
        
        const settings = this._map.getControls('settings')
        await settings.updateConfig(['activeTheme'], theme.id)
        await settings.applyThemeConfig()
      })
      header.appendChild(btn)
      return [name, params]
    }))

    this._map.on('configupdated', (e) => {
      if (!Array('activeTheme', 'themes').includes(e.details.property[0])) return
      Object.entries(navBtns).forEach(([name, params]) => {
        Alpine.$data(params.btn).disabled = params.isDisabled()
      })
    })

    if (!this._map.isStaticConfig()) {
      const addTheme = utils.strToEl(button({
        title: 'Add new theme',
        icon: svg.plusCircleMini,
        classStr: 'size-[15px]! self-center border-none! opacity-50 hover:opacity-100',
        attrs: `x-show=isRadioValue("current")`,
        minimal: true,
        themedBg: false,
      }))
      utils.appendBinding(addTheme, ':class', `['text-green-500/100! dark:text-green-500/100!']: true`)
      addTheme.addEventListener('click', async (e) => {
        const newTheme = Map.getDefaultConfig().themes[0]
        await this.addNewTheme(newTheme)
      })
      header.appendChild(addTheme)
    }

    const collapse = document.createElement('span')
    collapse.classList.add('size-[15px]!', 'self-center', 'cursor-pointer', 'opacity-25', 'hover:opacity-100')
    collapse.setAttribute('x-html', 'show ? svg.chevronUpMini : svg.chevronDownMini')
    collapse.setAttribute('@click', 'show=!show')
    header.appendChild(collapse)
  
    const themesContainer = this.themesContainer = document.createElement('div')
    themesContainer.classList.add('flex', 'flex-col', 'gap-5')
    themesContainer.setAttribute('x-show', 'show')
    themesContainer.setAttribute('x-sort', '')
    themesContainer.setAttribute(':class', `{['scrollbar-thumb-'+color+'-600/25!']: true}`)
    container.appendChild(themesContainer)

    this.config.themes.forEach(theme => {
      this.createThemeSection(theme)
    })
  }

  createThemeSection(theme, {index}={}) {
    const themeContainer = document.createElement('div')
    themeContainer.setAttribute(`x-sort:item`, `${theme.id}`)
    themeContainer.setAttribute('x-show', `isRadioValue("edit") || activeTheme === "${theme.id}"`)
    themeContainer.classList.add('flex', 'flex-col', 'gap-1')
    if (!isNaN(index) && this.themesContainer.children.length > index+1) {
      this.themesContainer.insertBefore(themeContainer, this.themesContainer.children[index+1])
    } else {
      this.themesContainer.appendChild(themeContainer)
    }

    const headerContainer = document.createElement('div')
    headerContainer.classList.add('relative')
    headerContainer.setAttribute('x-data', '{showOptions:false}')
    themeContainer.appendChild(headerContainer)

    const titleContainer = document.createElement('div')
    titleContainer.classList.add('flex', 'flex-nowrap', 'gap-1', 'grow')
    headerContainer.appendChild(titleContainer)

    const titleSpan = document.createElement('span')
    titleSpan.innerText = `Title`  
    titleContainer.appendChild(titleSpan)

    const titleInput = document.createElement('span')
    titleInput.innerHTML = theme.metadata.title
    titleInput.classList.add('font-bold!')
    titleInput.setAttribute('name', `title_${theme.id}`)
    titleInput.setAttribute('contenteditable', 'false')
    titleInput.setAttribute('x-init', `$el.setAttribute('contenteditable', isRadioValue("edit"))`)
    titleContainer.appendChild(titleInput)
    
    const btnsContainer = document.createElement('div')
    btnsContainer.classList.add('flex', 'gap-2', 'absolute', 'top-0', 'right-0', 'mt-1')
    utils.appendBinding(btnsContainer, ':class', `['me-1']: isRadioValue("edit")`)
    headerContainer.appendChild(btnsContainer)

    const moveTheme = utils.strToEl(button({
      title: 'Move theme',
      icon: svg.bars3Mini,
      classStr: `size-[15px]! self-center border-none! opacity-25 hover:opacity-100`,
      attrs: `x-show=isRadioValue("edit") x-sort:handle`,
      themedBg: false,
      minimal: true,
    }))
    btnsContainer.appendChild(moveTheme)  
    
    const activateTheme = utils.strToEl(button({
      title: 'Set as active theme',
      icon: svg.checkCircleMini,
      classStr: `size-[15px]! self-center border-none!`,
      attrs: `name='activeThemeBtn' x-show=isRadioValue("edit")`,
      themedBg: false,
      minimal: true,
    }))
    utils.appendBinding(activateTheme, ':class', `['text-green-500/100! dark:text-green-500/100!']: activeTheme === "${theme.id}"`)
    activateTheme.addEventListener('click', async (e) => {
      Alpine.$data(this.themesContainer).activeTheme = theme.id
    })
    btnsContainer.appendChild(activateTheme)  

    if (!this._map.isStaticConfig()) {
      const optionsToggle = utils.strToEl(button({
        title: 'Theme options',
        icon: svg.ellipsisHorizontalMini,
        classStr: 'size-[15px]! rounded! self-center border-none! opacity-25 hover:opacity-100',
        minimal: true,
        attrs: `
          x-show=isRadioValue("current")
          x-ref="optionsToggle"
          @click='showOptions = !showOptions'
        `,
      }))
      btnsContainer.appendChild(optionsToggle)

      const optionsContent = document.createElement('div')
      optionsContent.classList.add(
        'absolute', 'top-5', 'right-0', 'w-20', 
        'flex', 'flex-col', 'gap-1', 
        'text-xs', 'z-5', 
        'cursor-pointer', 
        'justify-end', 
        'rounded', 'shadow-lg')
      optionsContent.setAttribute('@click.outside', 'showOptions = false')
      optionsContent.setAttribute('x-show', 'showOptions && isRadioValue("current")')
      optionsContent.setAttribute('x-anchor.fixed', '$refs.optionsToggle')
      utils.appendBinding(optionsContent, `:class`, `['bg-'+color+'-200/100! dark:bg-'+color+'-950/100!']: true`)
      headerContainer.appendChild(optionsContent)

      const duplicateTheme = document.createElement('span')
      duplicateTheme.innerText = 'Duplicate'
      duplicateTheme.addEventListener('click', async (e) => {
        const newTheme = Map.getDefaultConfig().themes[0]
        newTheme.metadata.title = `${theme.metadata.title} copy`
        newTheme.metadata.description = theme.metadata.description
        newTheme.settings = structuredClone(theme.settings)
        newTheme.layers = structuredClone(theme.layers)

        await this.addNewTheme(newTheme)
      })
      optionsContent.appendChild(duplicateTheme)

      const removeTheme = document.createElement('span')
      removeTheme.innerText = 'Remove'
      removeTheme.addEventListener('click', async (e) => {
        const themes = this.config.themes
        const index = themes.findIndex(i => i.id === theme.id)
        const newActiveTheme = themes[index === themes.length-1 ? index-1 : index+1]
  
        themeContainer.remove()
        Alpine.$data(this.themesContainer).activeTheme = newActiveTheme.id
  
        const settings = this._map.getControls('settings')
        await settings.updateConfig(['themes'], themes.filter(i => i.id !== theme.id))
        await settings.updateConfig(['activeTheme'], newActiveTheme.id)
        await settings.applyThemeConfig()
      })
      optionsContent.appendChild(removeTheme)

      Array.from(optionsContent.children).forEach((el, index) => {
        utils.appendBinding(el, `:class`, `['hover:bg-'+color+'-600/50!']: true`)
        el.setAttribute('@click', `showOptions = false`)
        el.classList.add(
          'px-2', 'py-1', 
          index === 0 ? 'rounded-t' 
          : index === optionsContent.children.length-1 ? 'rounded-b' 
          : 'rounded-0'
        )
      })
    }

    const descContainer = document.createElement('div')
    descContainer.classList.add('flex', 'flex-nowrap', 'gap-1')
    themeContainer.appendChild(descContainer)

    const descSpan = document.createElement('span')
    descSpan.innerText = `Description`  
    descContainer.appendChild(descSpan)

    const descInput = document.createElement('span')
    descInput.innerHTML = theme.metadata.description
    descInput.setAttribute('name', `description_${theme.id}`)
    descInput.setAttribute('contenteditable', 'false')
    descInput.setAttribute('x-init', `$el.setAttribute('contenteditable', isRadioValue("edit"))`)
    descContainer.appendChild(descInput)

    this.configInputElements(themeContainer)
    Array(titleSpan, descSpan).forEach(i => {
      i.setAttribute('x-show', `isRadioValue("edit")`)
      i.classList.add(
        'opacity-50', 
        'min-w-[65px]', 
        i.parentElement.classList.contains('flex-col') 
        ? 'self.start' 
        : 'self-center'
      )
    })
  }

  async addNewTheme(newTheme) {
    const themes = this.config.themes
    const index = themes.findIndex(i => i.id === this.config.activeTheme)

    const settings = this._map.getControls('settings')
    await settings.updateConfig(['themes'], [
      ...themes.slice(0, index+1),
      newTheme,
      ...themes.slice(index+1)
    ])
    await settings.updateConfig(['activeTheme'], newTheme.id)
    await settings.applyThemeConfig()
    
    this.createThemeSection(newTheme, {index})
    Alpine.$data(this.themesContainer).activeTheme = newTheme.id
  }

  addReferenceSection(parent) {
    let reference = this.metadata.references
    if (!reference) return
    
    const container = document.createElement('div')
    container.classList.add('flex', 'flex-col', 'gap-1')
    container.setAttribute('x-data', '{show:true}')
    parent.appendChild(container)

    const header = document.createElement('span')
    header.classList.add('flex', 'flex-nowrap', 'justify-between', 'align-middle', 'font-bold')
    container.appendChild(header)

    const referencesLabel = document.createElement('span')
    referencesLabel.innerText = 'References'
    header.appendChild(referencesLabel)

    const collapse = document.createElement('span')
    collapse.setAttribute('@click', 'show=!show')
    collapse.classList.add('size-[15px]!', 'self-center', 'cursor-pointer', 'opacity-25', 'hover:opacity-100')
    collapse.setAttribute('x-html', 'show ? svg.chevronUpMini : svg.chevronDownMini')
    header.appendChild(collapse)

    const content = document.createElement('div')
    content.classList.add('flex', 'flex-col', 'gap-1')
    content.setAttribute('x-show', 'show')
    container.appendChild(content)

    while (reference) {
      const referenceContainer = document.createElement('div')
      content.appendChild(referenceContainer)
      const titleContainer = document.createElement('div')
      titleContainer.classList.add('flex', 'flex-nowrap', 'gap-1')
      referenceContainer.appendChild(titleContainer)
  
      const titleIcon = document.createElement('span')
      titleIcon.innerText = `🗺️`  
      titleContainer.appendChild(titleIcon)
  
      const {title, creator, dateCreated} = reference.metadata

      const mapLink = document.createElement('a')
      mapLink.innerText = `${title} (${creator}, ${utils.formatDate(new Date(dateCreated), {
        numeric: true,
      })})`
      mapLink.setAttribute('href', `${utils.getBaseURL(window.location.href)}?src=${reference.src}&id=${reference.id}`)
      mapLink.setAttribute('target', '_blank')
      titleContainer.appendChild(mapLink)

      reference = reference.metadata.references
    }
  }

  onRemove() {
    this._container.parentNode.removeChild(this._container);
    this._map = undefined;
  }
}
