import * as svg from '../../svg.js'
import button from '../../templates/button.js';
import Map from './map.js'

export default class MetadataControl {
  onAdd(map) {
    this._map = map
    const metadata = map._ms.config.metadata
    
    const container = this._container = document.createElement('div')
    container.style.maxWidth = `80vw`
    container.classList.add('maplibregl-ctrl','maplibregl-ctrl-group', 'flex', 'flex-col', 'gap-3')

    const titleContainer = document.createElement('div')
    titleContainer.setAttribute('x-data', 'collapseGroup')
    titleContainer.setAttribute('@click.outside', 'closeCollapse')
    titleContainer.classList.add('ps-2')
    container.appendChild(titleContainer)

    const titleCurrent = document.createElement('div')
    titleCurrent.setAttribute('x-show', 'collapsed')
    titleContainer.appendChild(titleCurrent)
    
    const titleSpan = document.createElement('span')
    titleCurrent.appendChild(titleSpan)
    titleSpan.style.maxHeight = `10vh`
    titleSpan.style.maxWidth = `60vw`
    titleSpan.classList.add('word-break', 'text-wrap', 'truncate', 'text-ellipsis', 'overflow-auto', 'font-bold')
    titleSpan.setAttribute(':class', `{
      ['scrollbar-thumb-'+color+'-500/10!']: true  
    }`)
    titleSpan.innerHTML = metadata.title
    
    const editBtn = utils.strToEl(button({
      icon: svg.pencilSquareMini,
      attrs: `@click="toggleCollapse"`
    }))
    titleCurrent.appendChild(editBtn)
    
    const titleForm = document.createElement('div')
    titleForm.setAttribute('x-show', '!collapsed')
    titleContainer.appendChild(titleForm)

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
      titleSpan.innerHTML = metadata.title = value !== '' ? value : metadata.title
    })

    Array(titleCurrent, titleForm).forEach(i => {
      i.classList.add('flex', 'flex-nowrap', 'text-xl', 'gap-2')
    })

    Array(editBtn, saveBtn).forEach(i => {
      i.classList.add('grid', 'place-items-center', 'opacity-25', 'hover:opacity-100', 'rounded!')
    })

    return container
  }

  onRemove() {
    this._container.parentNode.removeChild(this._container);
    this._map = undefined;
  }
}