import button from './button.js'; 
import Alpine from 'alpinejs';

Alpine.data('modalApp', ({open=false}={}) => ({
    open: false,
    toggle() {
      this.open = !this.open
    },
    init() {
      this.$watch('open', value => {
        this.$dispatch('modalToggled', {key:'open', value})
      })
    
      if (open) {
        this.toggle()
      }
    },

}))

export default ({
    open=false,
    parent=`#app`,
    title='Modal',
    icon='',
    origin='top',
    content='',
    collapsible=false,
    label=true,
    modalClass='',
    toggleclass='',
}={}) => {
  return `
    <div x-id="['modal']" :id="$id('modal')" x-data="modalApp({'open':${open}})" class="${modalClass}">
      ${button({
        ...(label ? {label: title} : {title: `Toggle ${title.toLowerCase()}`}), 
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
              ['${utils.dynamicBgExp()}']: true,
            }"
            class="
              relative
              dark:text-white
              shadow-2xl
              rounded-none 
              sm:rounded-xl 
              size-full 
              sm:size-3/4 
              lg:w-1/2
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
                size-full!
              "
            >
              <div class="flex items-start justify-between px-3 pt-3">
                <div class="flex justify-start gap-2 items-center text-md font-bold">
                  ${icon || ''}
                  <h1>${title}</h1>
                </div>
              </div>
              <div
                :id="$id('modal', 'content')" 
                :class="{['scrollbar-thumb-'+color+'-600/25!']: true}"
                class="flex flex-col grow! overflow-auto p-1"
              >${content}</div>
            </div>
          </div>
        </div>
      </template>
    </div>
    `
}