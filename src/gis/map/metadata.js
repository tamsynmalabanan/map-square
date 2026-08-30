import Alpine from 'alpinejs';
import * as svg from '../../svg.js'
import button from '../../templates/button.js';
import Map from './map.js'
import { create } from 'lodash';

export default class MetadataControl {
  onAdd(map) {
    this._map = map

    const config = this.config = map.getConfig()
    const metadata = this.metadata = config.metadata
    const defaultMetadata = this.defaultMetadata = Map.getDefaultConfig().metadata
    const inputSelector = this.inputSelector = 'input, textarea, [contenteditable], [type="editor"]'
    
    const container = this._container = document.createElement('div')
    container.classList.add('maplibregl-ctrl','maplibregl-ctrl-group', 'sm:max-w-[80vw]', 'md:max-w-[60vw]', 'lg:max-w-[40vw]')
    container.setAttribute('x-data', 'collapseGroup({value:false})')
    
    container.innerHTML = button({
      title: 'Metadata',
      icon: svg.informationCircleMini,
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

    if (config.id) {
      const details = this.details = document.createElement('div')
      details.classList.add('flex', 'flex-col', 'gap-5')
      details.setAttribute('x-data', '{show:true}')
      details.setAttribute('x-show', 'show')
      form.appendChild(details)

      const createdSpan = document.createElement('span')
      createdSpan.classList.add('font-thin!', 'text-xs!', 'opacity-50', 'italic')
      createdSpan.innerText = `${utils.formatDate(new Date(this.metadata.dateCreated), {time:true})}`  
      details.appendChild(createdSpan)

      this.addDescriptionSection(details)
      this.addReferenceSection(details)
      this.addAttrSection(details)
      this.addAcknowledgementsSection(details)

      details.querySelectorAll('span[contenteditable]').forEach(element => {
        element.classList.add(
          'max-h-[10vh]',
          'overflow-auto',
          'break-normal', 
          'text-wrap', 
          'text-[12px]',
          'grow',
        )
      })
    }

    form.querySelectorAll(inputSelector).forEach(i => {
      i.classList.add('focus:outline-none', 'rounded!')
      
      if (!i.getAttribute('contenteditable')) {
        i.setAttribute('readonly', 'true')
      }

      utils.appendBinding(i, ':class', `
        ['bg-'+color+'-500/50! p-2!']: isRadioValue("edit")
      `)
    })

    form.querySelectorAll('.overflow-auto').forEach(i => {
      utils.appendBinding(i , ':class', `
        ['scrollbar-thumb-'+color+'-500/10!']: true  
      `)
    })

    return container
  }

  addNavSection(parent) {
    const nav = this.nav = document.createElement('div')
    nav.classList.add('flex', 'flex-nowrap', 'gap-2', 'absolute', 'right-0', 'm-1', 'top-0')
    parent.appendChild(nav)

        const editBtn = utils.strToEl(button({
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

    const backBtn = utils.strToEl(button({
        title: 'Go back',
        icon: svg.arrowUturnLeftMini,
        attrs: `@click='toggleRadio("current")' x-show='isRadioValue("edit")'`
    }))
    backBtn.addEventListener('click', () => {
      this.form.querySelectorAll(this.inputSelector).forEach(i => {
        const name = i.getAttribute('name')
        if (!name || !(name in this.metadata)) return
        
        const type = i.getAttribute('type')
        const target = this.form.querySelector(`[name="${name}"]:not(input):not([type="editor"])`)
        const value = this.metadata[name]

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
            Alpine.$data(target).show = value !== this.defaultMetadata[name]
          }
        }

      })
    })
    nav.appendChild(backBtn)

    const saveBtn = utils.strToEl(button({
        title: 'Save changes',
        icon: svg.checkCircleMini,
        attrs: `@click='toggleRadio("current")' x-show='isRadioValue("edit")'`
    }))
    saveBtn.addEventListener('click', async () => {
      for (const i of this.form.querySelectorAll(this.inputSelector)) {

        const isInputEl = !i.getAttribute('contenteditable')
  
        if (isInputEl) {
          i.setAttribute('readonly', 'true')
        } else {
          i.setAttribute('contenteditable', 'false')
        }
  
        const name = i.getAttribute('name')
        if (!name || !(name in this.metadata)) continue
  
        const type = i.getAttribute('type')
        const target = this.form.querySelector(`[name="${name}"]:not(input):not([type="editor"])`)
  
        let value = isInputEl ? type === 'file' ? target.src : i.value : i.innerHTML
        
        if (type === 'editor') {
          const quill = Quill.find(i.querySelector('.ql-container'))
          value = quill.root.innerHTML
          quill.enable(false)
        } else if (type === 'file') {
          i.value = ''
        } else if (typeof value === 'string') {
          value = utils.removeWhitespace(value)

          if (!isInputEl && i.textContent === '') {
            i.innerHTML = value = this.defaultMetadata[name]            
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
  
        if (value === this.metadata[name]) continue
        map.getControls('settings').updateConfig(['metadata', name], value)
      }
    })
    nav.appendChild(saveBtn)
  
    let collapseBtn
    if (this.config.id) {
      collapseBtn = utils.strToEl(button({
        title: 'Toggle details',
        icon: svg.chevronUpMini,
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
      'max-h-[10vh]',
      'min-w-[20vw]',
      'max-w-[80vw]',
      'break-normal', 
      'text-wrap', 
      'overflow-auto', 
      'font-bold',
      'text-xl',
      'grow',
    )
    container.appendChild(titleInput)
  }

  addLogoSection(parent) {
    const logoForm = document.createElement('div')
    logoForm.classList.add('flex', 'flex-col', 'gap-2')
    parent.appendChild(logoForm)

    const logoImg = document.createElement('img')
    logoImg.classList.add('size-[10vh]', 'rounded', 'me-2')
    logoImg.src = this.metadata.logo
    logoImg.setAttribute('name', 'logo')
    logoImg.setAttribute('x-data', `{show: ${this.metadata.logo !== this.defaultMetadata.logo}}`)
    logoImg.setAttribute('x-show', `isRadioValue("edit") || show`)
    logoForm.appendChild(logoImg)

    const logoInputs = document.createElement('div')
    logoInputs.classList.add('flex', 'flex-nowrap', 'gap-1', 'me-2')
    logoInputs.setAttribute('x-show', 'isRadioValue("edit")')
    logoForm.appendChild(logoInputs)

    const logoInputContainer = document.createElement('div')
    logoInputContainer.classList.add('grow')
    logoInputs.appendChild(logoInputContainer)

    const logoLabel = document.createElement('label')
    logoLabel.innerText = '📁'
    logoLabel.setAttribute(':class', `{ ['bg-'+color+'-500/50!']: true, ['bg-'+color+'-100/100! dark:bg-'+color+'-950/100! enabled:hover:bg-'+color+'-500/50!']: !(true) }`)
    logoLabel.className = `w-7vh flex justify-center items-center gap-2 rounded py-1 px-2 dark:text-white cursor-pointer grow`
    logoInputContainer.appendChild(logoLabel)
    
    const logoInput = document.createElement('input')
    logoInput.id = utils.randomId()
    logoLabel.setAttribute('for', logoInput.id)
    logoInput.classList.add('w-0', 'invisible')
    logoInput.setAttribute('name', 'logo')
    logoInput.setAttribute('type', 'file')
    logoInput.setAttribute('accept', 'image/*')
    logoInput.addEventListener('change', async () => {
      const file = logoInput.files[0]
      logoImg.src = file ? await utils.fileToDataURL(file) : this.defaultMetadata.logo
      Alpine.$data(logoImg).show = file !== undefined
    })
    logoInputContainer.appendChild(logoInput)

    const removeLogoBtn = utils.strToEl(button({
      icon: '🗑️',
      title: 'Remove current logo',
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
    header.setAttribute('@click', 'show=!show')
    container.appendChild(header)

    const label = document.createElement('span')
    label.innerText = 'Attribution'
    header.appendChild(label)

    const collapse = document.createElement('span')
    collapse.classList.add('size-[15px]!', 'self-center')
    collapse.setAttribute('x-html', 'show ? svg.chevronUpMini : svg.chevronDownMini')
    header.appendChild(collapse)

    const content = document.createElement('div')
    content.classList.add('flex', 'flex-nowrap')
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
      i.classList.add('w-[45px]', 'opacity-50')
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
    header.setAttribute('@click', 'show=!show')
    container.appendChild(header)

    const label = document.createElement('span')
    label.innerText = 'Acknowledgements'
    header.appendChild(label)

    const collapse = document.createElement('span')
    collapse.classList.add('size-[15px]!', 'self-center')
    collapse.setAttribute('x-html', 'show ? svg.chevronUpMini : svg.chevronDownMini')
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
    header.setAttribute('@click', 'show=!show')
    container.appendChild(header)

    const label = document.createElement('span')
    label.innerText = 'Description'
    header.appendChild(label)

    const collapse = document.createElement('span')
    collapse.classList.add('size-[15px]!', 'self-center')
    collapse.setAttribute('x-html', 'show ? svg.chevronUpMini : svg.chevronDownMini')
    header.appendChild(collapse)

    const descInput = document.createElement('div')
    descInput.setAttribute('type', 'editor')
    descInput.setAttribute('name', 'description')
    descInput.setAttribute('x-show', 'show')
    descInput.setAttribute(':class', `{
      ['scrollbar-thumb-'+color+'-500/10!']: true  
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
    descEditor.classList.add('p-0!', 'overflow-auto', 'max-h-[30vh]')
    descEditor.setAttribute('x-ref', 'descriptionInput')
    utils.appendBinding(descEditor, ':class', `
      ['min-h-[20vh]']: isRadioValue("edit")
    `)
    
    const descToolbar = descInput.querySelector('.ql-toolbar')
    descToolbar.setAttribute('x-show', 'isRadioValue("edit")')
    utils.appendBinding(descToolbar.querySelector('.ql-picker-options'), ':class', `
      ['bg-'+color+'-100/50! dark:bg-'+color+'-950/50!']: true
    `)
  }

  addReferenceSection(parent) {
    let reference = this.metadata.references
    if (!reference) return
    
    const referencesContainer = document.createElement('div')
    referencesContainer.classList.add('flex', 'flex-col', 'gap-1')
    referencesContainer.setAttribute('x-data', '{show:false}')
    parent.appendChild(referencesContainer)

    const referencesHeader = document.createElement('span')
    referencesHeader.classList.add('flex', 'flex-nowrap', 'justify-between', 'align-middle', 'font-bold')
    referencesHeader.setAttribute('@click', 'show=!show')
    referencesContainer.appendChild(referencesHeader)

    const referencesLabel = document.createElement('span')
    referencesLabel.innerText = 'References'
    referencesHeader.appendChild(referencesLabel)

    const referencesCollapse = document.createElement('span')
    referencesCollapse.classList.add('size-[15px]!', 'self-center')
    referencesCollapse.setAttribute('x-html', 'show ? svg.chevronUpMini : svg.chevronDownMini')
    referencesHeader.appendChild(referencesCollapse)

    const referencesContent = document.createElement('div')
    referencesContent.classList.add('flex', 'flex-col', 'gap-1')
    referencesContent.setAttribute('x-show', 'show')
    referencesContainer.appendChild(referencesContent)

    while (reference) {
      const referenceContainer = document.createElement('div')
      referencesContent.appendChild(referenceContainer)
      const titleContainer = document.createElement('div')
      titleContainer.classList.add('flex', 'flex-nowrap', 'gap-1')
      referenceContainer.appendChild(titleContainer)
  
      const titleIcon = document.createElement('span')
      titleIcon.innerText = `🗺️`  
      titleContainer.appendChild(titleIcon)
  
      const mapLink = document.createElement('a')
      mapLink.innerText = `${reference.metadata.title} (${reference.metadata.creator}, ${(new Date(reference.metadata.dateCreated)).toLocaleDateString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
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