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
        label: title, 
        icon, 
        collapsible,
        attrs: `@click="toggle"`,
        highlightExp: `open`,
        classStr: 'border-2'
      })}
      
      <template x-teleport="#app">
        <div 
          :id="$id('modal', 'container')" 
          x-show="open" 
          x-transition.origin.${origin}
          :class="{
            ['bg-'+color+'-100/50! dark:bg-'+color+'-950/50!']: true,
          }"
          class="z-10 absolute top-0 left-0 size-full flex items-center justify-center"
        >
          <div 
            :id="$id('modal')" 
            @click.outside="toggle" 
            :class="{
              ['bg-'+color+'-100/100! dark:bg-'+color+'-950/100!']: true,
            }"
            class="
              dark:text-white
              shadow-2xl
              rounded-none 
              sm:rounded-xl 
              size-full 
              sm:size-3/4 
              lg:w-1/2 p-4
              flex
              flex-col
              gap-5
            "
          >
            <div class="flex items-start justify-between">
              <div class="flex justify-start gap-2 items-center text-xl">
                ${icon || ''}
                <h1>${title}</h1>
              </div>
              ${button({
                icon: svg.xMini,
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