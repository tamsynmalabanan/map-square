export default ({
  containerClass='absolute top-0 left-0',
  toggleHTML='Toggle Modal',
  modalTitle='Modal'
}={}) => {
  return {
    template: `
    <div x-id="['modal']" x-data="modalApp()" class="${containerClass}">
      <button :id="$id('modal', 'toggle')" x-show="!open" @click="toggle">${toggleHTML}</button>
      
      <template x-teleport="#app">
        <div :id="$id('modal', 'container')" x-show="open" class="z-10 absolute top-0 left-0 size-full flex items-center justify-center">
          <div :id="$id('modal')" @click.outside="toggle" class="bg-teal-50 border-teal-950/50 border-3 shadow-lg rounded-none sm:rounded-xl size-full sm:size-3/4 lg:w-1/2 p-4">
            <div class="flex items-start justify-between">
              <h1>${modalTitle}</h1>
              <button :id="$id('modal', 'dismiss')" @click="toggle">Close</button>
            </div>
          </div>
        </div>
      </template>
    </div>
    `,

    open: false,

    init() {
      console.log('populate modal')
    },

    toggle() {
      this.open = ! this.open
    }
  }
}