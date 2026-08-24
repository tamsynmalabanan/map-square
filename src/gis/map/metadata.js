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

    const titleInput = document.createElement('textarea')
    titleInput.value = metadata.title
    titleInput.setAttribute('placeholder', 'Map title')
    titleInput.setAttribute('name', 'title')
    titleInput.style.maxHeight = `10vh`
    titleInput.style.minHeight = `25px`
    titleInput.style.maxWidth = `60vw`
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

    const nav = document.createElement('div')
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
      form.querySelectorAll('input, textarea').forEach(i => {
        i.removeAttribute('readonly')
      })
    })
    nav.appendChild(editBtn)

    const backBtn = utils.strToEl(button({
        title: 'Go back',
        icon: svg.arrowUturnLeftMini,
        attrs: `@click='toggleRadio("current")' x-show='isRadioValue("edit")'`
    }))
    backBtn.addEventListener('click', () => {
      form.querySelectorAll('input, textarea').forEach(i => {
        const name = i.getAttribute('name')
        if (!name || !(name in metadata)) return
        i.value = metadata[name]
        i.setAttribute('readonly', 'true')
      })
    })
    nav.appendChild(backBtn)

    const saveBtn = utils.strToEl(button({
        title: 'Save changes',
        icon: svg.checkCircleMini,
        attrs: `@click='toggleRadio("current")' x-show='isRadioValue("edit")'`
    }))
    saveBtn.addEventListener('click', () => {
      form.querySelectorAll('input, textarea').forEach(i => {
        i.setAttribute('readonly', 'true')

        const name = i.getAttribute('name')
        if (!name || !(name in metadata)) return

        let value = i.value
        if (typeof value === 'string') {
          value = utils.removeWhitespace(i.value)
          if (value === '' || value === metadata.title) return
        }

        map.updateConfig(['metadata', name], value)
      })
    })
    nav.appendChild(saveBtn)

    const detailsContainer = document.createElement('div')
    detailsContainer.classList.add('flex', 'flex-col', 'px-2')
    form.appendChild(detailsContainer)

    const authorContainer = document.createElement('div')
    authorContainer.classList.add('flex', 'flex-nowrap', 'gap-1')
    detailsContainer.appendChild(authorContainer)

    const authorSpan = document.createElement('span')
    authorSpan.innerText = `Created by`  
    authorContainer.appendChild(authorSpan)
    
    const authorInput = document.createElement('input')
    authorInput.value = metadata.author
    authorInput.setAttribute('placeholder', 'Autho name')
    authorInput.setAttribute('type', 'search')
    authorInput.setAttribute('name', 'author')
    authorInput.setAttribute('readonly', 'true')
    authorContainer.appendChild(authorInput)

    const createdSpan = document.createElement('span')
    detailsContainer.appendChild(createdSpan)
    createdSpan.innerText = `Created on ${utils.formatDate(new Date(metadata.dateCreated))}`  
    
    const updatedSpan = this.updatedSpan = document.createElement('span')
    updatedSpan.classList.add('flex', 'flex-nowrap', 'gap-1')
    detailsContainer.appendChild(updatedSpan)
    
    if (config.id) {
      this.setDateUpdated()
      
      setInterval(() => {
        this.setDateUpdated()
      }, 15000)
    }

    Array(editBtn, saveBtn, backBtn).forEach(i => {
      i.classList.add('grid', 'place-items-center', 'rounded!', 'size-[15px]!', 'opacity-25', 'hover:opacity-100')
    })

    form.querySelectorAll('input, textarea').forEach(i => {
      i.setAttribute('readonly', 'true')
      i.classList.add('focus:outline-none')
    })

    let updateTimer
    Array('themeUpdated', 'configUpdated', 'configSaved').forEach(i => {
      clearTimeout(updateTimer)
      setTimeout(() => {
        this._map.on(i, (e) => {
          this.setDateUpdated()
        
          console.log(e)
        })
      }, 2000);
    })

    return container
  }

  onRemove() {
    this._container.parentNode.removeChild(this._container);
    this._map = undefined;
  }

  setDateUpdated() {
    const config = this._map.getConfig()
    if (!config.id) return
 
    const metadata = config.metadata
    const dateUpdated = metadata.dateUpdated
    const dateSaved = metadata.dateSaved
    
    this.updatedSpan.innerHTML = `
      <span>Last updated ${utils.formatRelativeDate(new Date(dateUpdated))}</span>
      <span class="italic">${dateUpdated > dateSaved ? '(unsaved changes)' : ''}</span>
    `
  }
}