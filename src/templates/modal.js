import button from './button.js'; 
import Alpine from 'alpinejs';

Alpine.data('modalApp', ({open=false}={}) => ({
    open,
    toggle() {
      this.open = ! this.open
    }
}))

export default ({
    open=false,
    title='Modal',
    icon='',
    classStr='',
    origin='top',
    content='',
    collapsible=false
}={}) => {
  return `
    <div x-id="['modal']" x-data="modalApp({'open':${open}})" class="${classStr}">
      ${button({
        title, 
        icon, 
        collapsible,
        attrs: `@click="toggle"`,
        highlightExp: `open`
      })}
      
      <template x-teleport="#app">
        <div 
          :id="$id('modal', 'container')" 
          x-show="open" 
          x-transition.origin.${origin}
          class="z-10 absolute top-0 left-0 size-full flex items-center justify-center bg-teal-50/50 dark:bg-teal-950/50"
        >
          <div :id="$id('modal')" @click.outside="toggle" class="
            bg-teal-50 dark:bg-teal-950
            border-teal-950/50 dark:border-teal-50/50
            dark:text-white
            border-3 
            shadow-lg 
            rounded-none 
            sm:rounded-xl 
            size-full 
            sm:size-3/4 
            lg:w-1/2 p-4
            flex
            flex-col
            gap-5
          ">
            <div class="flex items-start justify-between">
              <div class="flex justify-start gap-2 items-center">
                ${icon || ''}
                <h1>${title}</h1>
              </div>
              ${button({
                icon: icons.close,
                attrs: `@click="toggle"`,
              })}
            </div>
            <div class="flex flex-col grow">${content}</div>
          </div>
        </div>
      </template>
    </div>
    `
}