import Alpine from 'alpinejs';

export default ({
  label='',
  title='',
  icon='',
  classStr='',
  attrs='',
  collapsible=false,
  highlightExp=false,
}={}) => {
  return `
    <button
      ${attrs}
      title="${title ?? label}"
      x-data
      x-id="['button']" 
      :id="$id('button')"
      :class="{
        ['bg-'+color+'-600/50!']: ${highlightExp},
        ['bg-'+color+'-200/100! dark:bg-'+color+'-950/100! enabled:hover:bg-'+color+'-600/50!']: !(${highlightExp})
      }"
      class="
        flex 
        justify-center 
        items-center
        border-gray-600/10!
        gap-2 
        rounded 
        py-1
        px-2 
        dark:text-white  
        cursor-pointer
        disabled:bg-gray-950/10!
        ${classStr}
      "
    >
      ${icon} 
      ${label !== '' ? `<span class="${collapsible && icon && `hidden sm:block`}">${label}</span>` : ''}
    </button>
  `
}