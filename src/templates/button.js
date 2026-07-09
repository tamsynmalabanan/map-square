import Alpine from 'alpinejs';

export default ({
  title='',
  icon='',
  classStr='',
  attrs='',
  collapsible=false,
  highlightExp=false,
  classBindings='',
}={}) => {
  return `
    <button
      ${attrs}
      x-data
      x-id="['button']" 
      :id="$id('button')"
      :class="{
        ['bg-'+color+'-500/50!']: ${highlightExp},
        ['bg-'+color+'-100/100! dark:bg-'+color+'-950/100! hover:bg-'+color+'-500/50!']: !(${highlightExp}),
      }"
      class="
        flex 
        justify-center 
        items-center
        border-gray-500/50
        gap-2 
        rounded 
        py-1
        px-2 
        dark:text-white  
        cursor-pointer
        ${classStr}
      "
    >
      ${icon} 
      ${title !== '' ? `<span class="${collapsible && icon && `hidden sm:block`}">${title}</span>` : ''}
    </button>
  `
}