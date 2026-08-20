import * as svg from '../../svg.js'
import button from '../../templates/button.js';
import Map from './map.js'

export default class MetadataControl {
  onAdd(map) {
    this._map = map
    const config = map.getConfig()
    const metadata = config.metadata
    
    const container = this._container = document.createElement('div')
    container.style.maxWidth = `80vw`
    container.setAttribute('x-data', 'collapseGroup')
    container.setAttribute('@click.outside', 'closeCollapse')
    container.classList.add('maplibregl-ctrl','maplibregl-ctrl-group', 'flex', 'flex-col', 'gap-3', 'ps-2', 'py-1', 'pe-1')

    const currentMetadata = document.createElement('div')
    currentMetadata.setAttribute('x-show', 'collapsed')
    container.appendChild(currentMetadata)

    const titleContainer = document.createElement('div')
    currentMetadata.appendChild(titleContainer)

    const titleSpan = document.createElement('span')
    titleContainer.appendChild(titleSpan)
    titleSpan.style.maxHeight = `10vh`
    titleSpan.style.maxWidth = `60vw`
    titleSpan.classList.add(
      'word-break', 
      'text-wrap', 
      'truncate', 
      'text-ellipsis', 
      'overflow-auto', 
      'font-bold'
    )
    titleSpan.setAttribute(':class', `{
      ['scrollbar-thumb-'+color+'-500/10!']: true  
    }`)
    titleSpan.innerHTML = metadata.title
    
    const editBtn = utils.strToEl(button({
      icon: svg.pencilSquareMini,
      attrs: `@click="toggleCollapse"`
    }))
    titleContainer.appendChild(editBtn)

    const detailsContainer = document.createElement('div')
    detailsContainer.classList.add('flex', 'flex-col', 'gap-1')
    currentMetadata.appendChild(detailsContainer)

    const authorSpan = document.createElement('span')
    detailsContainer.appendChild(authorSpan)
    
    const createdSpan = document.createElement('span')
    detailsContainer.appendChild(createdSpan)
    
    const updatedSpan = document.createElement('span')
    detailsContainer.appendChild(updatedSpan)
    
    if (config.id) {
      authorSpan.innerText = `Created by ${metadata.author}`  
      createdSpan.innerText = `Created ${metadata.dateCreated}`  
      updatedSpan.innerText = `Updated ${metadata.dateUpdated}`  
    }

    const metadataForm = document.createElement('div')
    metadataForm.setAttribute('x-show', '!collapsed')
    container.appendChild(metadataForm)

    const titleForm = document.createElement('div')
    metadataForm.appendChild(titleForm)

    const titleInput = document.createElement('input')
    titleForm.appendChild(titleInput)
    titleInput.setAttribute('placeholder', 'Set map title...')
    titleInput.setAttribute('type', 'search')
    titleInput.classList.add('focus:outline-none')
    editBtn.addEventListener('click', () => titleInput.value = metadata.title)

    const saveBtn = utils.strToEl(button({
      icon: svg.checkCircleMini,
      attrs: `@click="toggleCollapse"`
    }))
    titleForm.appendChild(saveBtn)
    saveBtn.addEventListener('click', () => {
      const value = utils.removeWhitespace(titleInput.value)
      if (value === '' || value === metadata.title) return
      
      titleSpan.innerHTML = value
      map.updateConfig(['metadata', 'title'], value)
    })

    Array(currentMetadata, metadataForm).forEach(i => {
      i.classList.add('flex', 'flex-col')
    })

    Array(titleContainer, titleForm).forEach(i => {
      i.classList.add('flex', 'flex-nowrap', 'text-xl', 'gap-2')
    })

    Array(editBtn, saveBtn).forEach(i => {
      i.classList.add('grid', 'place-items-center', 'opacity-25', 'hover:opacity-100', 'rounded!')
    })

    this.configDisplayUpdate()

    return container
  }

  configDisplayUpdate() {
    Array('themeUpdated', 'configUpdated').forEach(i => {
      this._map.on(i, (e) => {
        console.log(e)
      })
    })
  }

  onRemove() {
    this._container.parentNode.removeChild(this._container);
    this._map = undefined;
  }
}