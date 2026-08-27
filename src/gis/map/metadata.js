import Alpine from 'alpinejs';
import * as svg from '../../svg.js'
import button from '../../templates/button.js';
import Map from './map.js'
import { create } from 'lodash';

export default class MetadataControl {
  onAdd(map) {
    this._map = map
    const config = map.getConfig()
    const metadata = config.metadata
    const defaultMetadata = Map.getDefaultConfig().metadata
    
    const container = this._container = document.createElement('div')
    container.style.maxWidth = `80vw`
    container.classList.add('maplibregl-ctrl','maplibregl-ctrl-group')
    container.setAttribute('x-data', 'collapseGroup({value:false})')
    
    container.innerHTML = button({
      title: 'Metadata',
      icon: svg.informationCircleMini,
      classStr: 'maplibregl-ctrl-metadata',
      attrs: `@click='toggleCollapse' x-show='collapsed'`
    })
    
    const inner = document.createElement('div')
    inner.classList.add('flex', 'flex-nowrap', 'gap-2', 'px-1', 'pt-1', 'pb-2', 'w-full!')
    inner.setAttribute('x-show', '!collapsed')
    inner.setAttribute('x-data', 'radioGroup({value:"current"})')
    container.appendChild(inner)
    
    const form = this.form = document.createElement('form')
    form.classList.add('flex', 'flex-col', 'gap-2', 'grow')
    form.addEventListener('submit', (e) => {
      e.preventDefault()
      e.stopPropagation()
    })
    inner.appendChild(form)
    
    const titleContainer = document.createElement('div')
    titleContainer.classList.add('flex', 'flex-nowrap', 'justify-between', 'gap-3', 'pe-1', 'ps-2')
    form.appendChild(titleContainer)

    const titleInput = document.createElement('span')
    titleInput.innerText = metadata.title
    titleInput.setAttribute('name', 'title')
    titleInput.setAttribute('contenteditable', "false")
    titleInput.style.maxHeight = `10vh`
    titleInput.style.minHeight = `25px`
    titleInput.style.maxWidth = `60vw`
    titleInput.style.minWidth = `20vw`
    titleInput.classList.add(
      'word-break', 
      'text-wrap', 
      'truncate', 
      'text-ellipsis', 
      'overflow-auto', 
      'font-bold',
      'text-xl',
      'grow',
    )
    titleInput.setAttribute(':class', `{
      ['scrollbar-thumb-'+color+'-500/10!']: true  
    }`)
    titleContainer.appendChild(titleInput)

    const nav = this.nav = document.createElement('div')
    nav.classList.add('flex', 'flex-col', 'gap-1')
    inner.appendChild(nav)
    
    nav.appendChild(utils.strToEl(button({
        title: 'Collapse metadata',
        icon: svg.xMini,
        classStr: 'maplibregl-ctrl-close',
        attrs: `@click='toggleCollapse'  x-show='isRadioValue("current")'`
    })))

    const editBtn = utils.strToEl(button({
        title: 'Edit metadata',
        icon: svg.pencilSquareMini,
        attrs: `@click='toggleRadio("edit")' x-show='isRadioValue("current")'`
    }))
    editBtn.addEventListener('click', () => {
      form.querySelectorAll('input, textarea, [contenteditable="false"]').forEach(i => {
        i.getAttribute('contenteditable') 
        ? i.setAttribute('contenteditable', "true") 
        : i.removeAttribute('readonly')
      })
    })
    nav.appendChild(editBtn)

    const backBtn = utils.strToEl(button({
        title: 'Go back',
        icon: svg.arrowUturnLeftMini,
        attrs: `@click='toggleRadio("current")' x-show='isRadioValue("edit")'`
    }))
    backBtn.addEventListener('click', () => {
      form.querySelectorAll('input, textarea, [contenteditable="true"]').forEach(i => {
        const name = i.getAttribute('name')
        if (!name || !(name in metadata)) return
        
        const type = i.getAttribute('type')
        const target = form.querySelector(`[name="${name}"]:not(input)`)

        if (i.getAttribute('contenteditable')) {
          i.innerText = metadata[name]
          i.setAttribute('contenteditable', 'false')
        } else {
          i.value = type === 'file' ? '' : metadata[name]
          i.setAttribute('readonly', 'true')
        }

        if (type === 'file') {
          target.src = metadata[name]
          Alpine.$data(target).show = metadata[name] !== defaultMetadata[name]
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
      for (const i of form.querySelectorAll('input, textarea, [contenteditable="true"]')) {

        const isInputEl = !i.getAttribute('contenteditable')
  
        if (isInputEl) {
          i.setAttribute('readonly', 'true')
        } else {
          i.setAttribute('contenteditable', 'false')
        }
  
        const name = i.getAttribute('name')
        if (!name || !(name in metadata)) continue
  
        const type = i.getAttribute('type')
        const target = form.querySelector(`[name="${name}"]:not(input)`)
  
        let value = isInputEl ? type === 'file' ? target.src : i.value : i.innerText
  
        
        if (type === 'file') {
          i.value = ''
        } else if (typeof value === 'string') {
          value = utils.removeWhitespace(value)
  
          if (value === '' && !isInputEl) {
            i.innerText = value = defaultMetadata[name]            
          }
  
          if (type === 'url') {
            target.href = value
            target.innerText = utils.getBaseURL(value)
          }
        }
  
        if (value === metadata[name]) continue
        map.getControls('settings').updateConfig(['metadata', name], value)
      }
    })
    nav.appendChild(saveBtn)

    let collapseBtn
    if (config.id) {
      collapseBtn = utils.strToEl(button({
        title: 'Toggle details',
        icon: svg.chevronUpMini,
      }))
      nav.appendChild(collapseBtn)
      
      const details = document.createElement('div')
      details.classList.add('flex', 'flex-nowrap', 'ps-2', 'pe-1')
      details.setAttribute('x-data', '{show:true}')
      details.setAttribute('x-show', 'show')
      form.appendChild(details)

      collapseBtn.addEventListener('click', () => {
        const data = Alpine.$data(details)
        data.show = !data.show
        collapseBtn.innerHTML = data.show ? svg.chevronUpMini : svg.chevronDownMini
      })

      const logoForm = document.createElement('div')
      logoForm.classList.add('flex', 'flex-col', 'gap-2')
      details.appendChild(logoForm)

      const logoImg = document.createElement('img')
      logoImg.classList.add('size-[10vh]', 'rounded', 'me-2')
      logoImg.src = metadata.logo
      logoImg.setAttribute('name', 'logo')
      logoImg.setAttribute('x-data', `{show: ${metadata.logo !== defaultMetadata.logo}}`)
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
        logoImg.src = file ? await utils.fileToDataURL(file) : defaultMetadata.logo
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

      const attrContainer = document.createElement('div')
      attrContainer.classList.add('grid', 'grid-flow-row', 'gap-1', 'grow')
      details.appendChild(attrContainer)

      const authorContainer = document.createElement('div')
      authorContainer.classList.add('flex', 'flex-nowrap', 'gap-1')
      attrContainer.appendChild(authorContainer)

      const authorSpan = document.createElement('span')
      authorSpan.innerText = `🆔`  
      authorContainer.appendChild(authorSpan)

      const authorInput = document.createElement('span')
      authorInput.innerText = metadata.author
      authorInput.setAttribute('name', 'author')
      authorInput.setAttribute('contenteditable', "false")
      authorInput.classList.add(
        'word-break', 
        'text-wrap', 
        'truncate', 
        'text-ellipsis', 
        'overflow-auto', 
        'text-[12px]',
        'grow',
      )
      authorContainer.appendChild(authorInput)

      const websiteContainer = document.createElement('div')
      websiteContainer.classList.add('flex', 'flex-nowrap', 'gap-1')
      attrContainer.appendChild(websiteContainer)

      const websiteSpan = document.createElement('span')
      websiteSpan.innerText = `🌐`  
      websiteContainer.appendChild(websiteSpan)

      const websiteInput = document.createElement('input')
      websiteInput.value = metadata.website
      websiteInput.classList.add('grow')
      websiteInput.setAttribute('placeholder', 'https://www.your-website.com')
      websiteInput.setAttribute('type', 'url')
      websiteInput.setAttribute('name', 'website')
      websiteInput.setAttribute('readonly', 'true')
      websiteInput.setAttribute('x-show', 'isRadioValue("edit")')
      websiteContainer.appendChild(websiteInput)

      const websiteCurrent = document.createElement('a')
      websiteCurrent.innerHTML = utils.getBaseURL(metadata.website)
      websiteCurrent.setAttribute('name', 'website')
      websiteCurrent.setAttribute('href', metadata.website)
      websiteCurrent.setAttribute('target', '_blank')
      websiteCurrent.setAttribute('x-show', 'isRadioValue("current")')
      websiteContainer.appendChild(websiteCurrent)

      const createdContainer = document.createElement('div')
      createdContainer.classList.add('flex', 'flex-nowrap', 'gap-1')
      attrContainer.appendChild(createdContainer)

      const createdIcon = document.createElement('span')
      createdIcon.innerText = `➕`  
      createdContainer.appendChild(createdIcon)

      const createdSpan = document.createElement('span')
      createdSpan.innerText = `${utils.formatDate(new Date(metadata.dateCreated), {time:true})}`  
      createdContainer.appendChild(createdSpan)
    
      const updatedSpan = this.updatedSpan = document.createElement('span')
      updatedSpan.classList.add('flex', 'flex-nowrap', 'gap-1')
      attrContainer.appendChild(updatedSpan)
      
      this.setDateUpdated()
      
      setInterval(() => {
        this.setDateUpdated()
      }, 60000)
    }

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

    form.querySelectorAll('input, textarea, [contenteditable]').forEach(i => {
      i.classList.add('focus:outline-none', 'rounded!')
      
      if (!i.getAttribute('contenteditable')) {
        i.setAttribute('readonly', 'true')
      }

      utils.appendBinding(i, ':class', `['bg-'+color+'-500/50! px-2!']: isRadioValue("edit")`)
    })

    this.handleUpdates()

    return container
  }

  onRemove() {
    this._container.parentNode.removeChild(this._container);
    this._map = undefined;
  }

  handleUpdates() {
    let timer
    Array('themeUpdated', 'configUpdated', 'configSaved').forEach(i => {
      clearTimeout(timer)
      setTimeout(() => {
        this._map.on(i, (e) => {
          this.setDateUpdated()
        
          console.log(e)
        })
      }, 2000)
    })
  }

  setDateUpdated() {
    if (!this.updatedSpan) return

    const config = this._map.getConfig()
    if (!config.id) return
 
    const metadata = config.metadata
    const dateUpdated = new Date(metadata.dateUpdated)
    const dateSaved = new Date(metadata.dateSaved)

    this.updatedSpan.innerHTML = `
      <span>⬆️ ${utils.formatRelativeDate(dateUpdated)}</span>
      <span class="italic">${dateUpdated > dateSaved ? '(unsaved)' : ''}</span>
    `
  }
}