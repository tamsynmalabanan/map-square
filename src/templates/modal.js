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
    parent=`#app`,
    title='Modal',
    icon='',
    classStr='',
    origin='top',
    content='',
    collapsible=false,
    label=true,
    toggleclass='',
}={}) => {
  return `
    <div x-id="['modal']" :id="$id('modal')" x-data="modalApp({'open':${open}})" class="${classStr}">
      ${button({
        ...(label ? {label: title} : {title: title}), 
        icon, 
        collapsible,
        attrs: `@click="toggle"`,
        highlightExp: `open`,
        classStr: `${toggleclass}`,
      })}
      <template x-teleport="${parent}">
        <div 
          :id="$id('modal', 'container')"
          x-show="open" 
          x-transition.origin.${origin}
          :class="{
            ['bg-'+color+'-200/50! dark:bg-'+color+'-950/50!']: true,
          }"
          class="z-10 absolute top-0 left-0 size-full flex items-center justify-center"
        >
          <div 
            :id="$id('modal', 'main')" 
            @click.outside="toggle" 
            :class="{
              ['bg-'+color+'-200/100! dark:bg-'+color+'-950/100!']: true,
            }"
            class="
              relative
              dark:text-white
              shadow-2xl
              rounded-none 
              sm:rounded-xl 
              size-full 
              sm:size-3/4 
              lg:w-1/2 p-4
            "
          >
            ${button({
              icon: svg.xMini,
              attrs: `@click="toggle"`,
              classStr: `size-[15px]! p-0! absolute top-[8px] right-[8px]`
            })}
            <div
              class="
                flex
                flex-col
                gap-5
              "
            >
              <div class="flex items-start justify-between">
                <div class="flex justify-start gap-2 items-center text-md font-bold">
                  ${icon || ''}
                  <h1>${title}</h1>
                </div>
              </div>
              <div :id="$id('modal', 'content')" class="flex flex-col grow">${content}</div>
            </div>
          </div>
        </div>
      </template>
    </div>
    `
}