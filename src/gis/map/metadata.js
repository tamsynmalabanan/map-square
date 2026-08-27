import Alpine from 'alpinejs';
import * as svg from '../../svg.js'
import button from '../../templates/button.js';
import Map from './map.js'

export default class MetadataControl {
  onAdd(map) {
    this._map = map
    const config = map.getConfig()
    const metadata = config.metadata
    
    const container = this._container = document.createElement('div')
    container.classList.add('maplibregl-ctrl','maplibregl-ctrl-group')
    container.setAttribute('x-data', 'collapseGroup({value:false})')

    container.innerHTML = button({
      title: 'Metadata',
      icon: svg.informationCircleMini,
      classStr: 'maplibregl-ctrl-metadata',
      attrs: `@click='toggleCollapse' x-show='collapsed'`
    })
    
    const form = this.form = document.createElement('form')
    form.style.maxWidth = `80vw`
    form.classList.add('flex', 'flex-col', 'gap-1', 'p-1')
    form.setAttribute('x-show', '!collapsed')
    form.setAttribute('x-data', 'radioGroup({value:"current"})')
    form.addEventListener('submit', (e) => {
      e.preventDefault()
      e.stopPropagation()
    })
    container.appendChild(form)
    
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
    )
    titleInput.setAttribute(':class', `{
      ['scrollbar-thumb-'+color+'-500/10!']: true  
    }`)
    titleContainer.appendChild(titleInput)

    const nav = this.nav = document.createElement('div')
    nav.classList.add('flex', 'flex-col', 'gap-1')
    titleContainer.appendChild(nav)
    
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
        i.getAttribute('contenteditable') ? i.setAttribute('contenteditable', "true") : i.removeAttribute('readonly')
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
        
        if (i.getAttribute('contenteditable')) {
          i.innerText = metadata[name]
          i.setAttribute('contenteditable', 'false')
        } else {
          i.value = metadata[name]
          i.setAttribute('readonly', 'true')
        }
      })
    })
    nav.appendChild(backBtn)

    const saveBtn = utils.strToEl(button({
        title: 'Save changes',
        icon: svg.checkCircleMini,
        attrs: `@click='toggleRadio("current")' x-show='isRadioValue("edit")'`
    }))
    saveBtn.addEventListener('click', () => {
      const defaultMetadata = Map.getDefaultConfig().metadata

      form.querySelectorAll('input, textarea, [contenteditable="true"]').forEach(i => {
        const isInputEl = !i.getAttribute('contenteditable')

        if (isInputEl) {
          i.setAttribute('readonly', 'true')
        } else {
          i.setAttribute('contenteditable', 'false')
        }

        const name = i.getAttribute('name')
        if (!name || !(name in metadata)) return

        let value = isInputEl ? i.value : i.innerText
        if (typeof value === 'string') {
          console.log(value, defaultMetadata[name])
          value = utils.removeWhitespace(value)
          if (value === metadata.title) return
          if (value === '' && !isInputEl) {
            console.log(defaultMetadata[name])
            i.innerText = value = defaultMetadata[name]            
          }
        }

        map.getControls('settings').updateConfig(['metadata', name], value)
      })
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
      details.classList.add('flex', 'flex-col', 'px-2')
      details.setAttribute('x-data', '{show:true}')
      details.setAttribute('x-show', 'show')
      form.appendChild(details)

      collapseBtn.addEventListener('click', () => {
        const data = Alpine.$data(details)
        data.show = !data.show
        collapseBtn.innerHTML = data.show ? svg.chevronUpMini : svg.chevronDownMini
      })

      const authorContainer = document.createElement('div')
      authorContainer.classList.add('flex', 'flex-nowrap', 'gap-1')
      details.appendChild(authorContainer)

      const authorSpan = document.createElement('span')
      authorSpan.innerText = `Created by`  
      authorContainer.appendChild(authorSpan)

      const authorInput = document.createElement('input')
      authorInput.value = metadata.author
      authorInput.setAttribute('placeholder', 'Unknown Author')
      authorInput.setAttribute('type', 'search')
      authorInput.setAttribute('name', 'author')
      authorInput.setAttribute('readonly', 'true')
      authorContainer.appendChild(authorInput)

      const createdSpan = document.createElement('span')
      details.appendChild(createdSpan)
      createdSpan.innerText = `Created on ${utils.formatDate(new Date(metadata.dateCreated))}`  
    
      const updatedSpan = this.updatedSpan = document.createElement('span')
      updatedSpan.classList.add('flex', 'flex-nowrap', 'gap-1')
      details.appendChild(updatedSpan)
      
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
      i.classList.add('focus:outline-none')
      
      if (!i.getAttribute('contenteditable')) {
        i.setAttribute('readonly', 'true')
      }
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
      <span>Last updated ${utils.formatRelativeDate(dateUpdated)}</span>
      <span class="italic">${dateUpdated > dateSaved ? '(unsaved)' : ''}</span>
    `
  }
}