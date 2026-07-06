import Alpine from 'alpinejs';

export default ({
  title='',
  icon='',
  classStr='',
  attrs='',
  collapsible=false,
}={}) => {
  return `
    <button 
      ${attrs}
      x-data
      x-id="['button']" 
      :id="$id('button')" 
      class="
        flex 
        justify-center 
        items-center 
        gap-2 
        rounded 
        py-1
        px-2 
        border-teal-950/50 
        dark:border-teal-50/50 
        bg-teal-50 
        dark:bg-teal-950 
        dark:text-white 
        hover:bg-teal-500 
        cursor-pointer
        ${classStr}
      "
    >
      ${icon} 
      ${title !== '' ? `<span class="${collapsible && icon && `hidden sm:block`}">${title}</span>` : ''}
    </button>
  `
}