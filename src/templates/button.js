import Alpine from 'alpinejs';

export default ({
  label='',
  title='',
  icon='',
  classStr='',
  attrs='',
  minimal=false,
  collapsible=false,
  highlightExp=false,
  color=null,
  themedBtn=true,
}={}) => {
  const property = minimal ? 'text' : 'bg'

  return `
    <button
      ${attrs}
      title="${title ?? label}"
      x-data
      x-id="['button']" 
      :id="$id('button')"
      ${themedBtn ? `
        ${minimal ? `
          :class="{
            ['opacity-100!']: ${highlightExp},
            ['enabled:hover:opacity-100! opacity-25!']: !(${highlightExp})
          }"
        ` : `
          :class="{
            ['bg-'+color+'-600/50!']: ${highlightExp},
            ['enabled:hover:bg-'+color+'-600/50! ${utils.dynamicThemeExp({property})}']: !(${highlightExp})
          }"
        `}
      ` : ``}
      class="
        flex 
        justify-center 
        items-center
        border-gray-600/25!
        gap-2 
        rounded 
        py-1
        px-2 
        cursor-pointer
        ${themedBtn ? `dark:text-white` : ''}  
        ${minimal ? 'disabled:text-gray-950/25!' : 'disabled:bg-gray-950/25!'}
        ${classStr}
      "
    >
      ${icon} 
      ${label !== '' ? `<span class="${collapsible && icon && `hidden sm:block`}">${label}</span>` : ''}
    </button>
  `
}