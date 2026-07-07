import Alpine from 'alpinejs';
import button from '../../templates/button.js'; 

export default (options={}) => {
  return `
    <div 
      x-data
      class="flex flex-col"
    >
      <div class='flex flex-nowrap justify-start items-start gap-3'>
        ${button({
            icon: icons.moonMini,
            title: 'Dark Mode',
            attrs: `@click="$store.displaySettings.toggleDarkMode()"`,
            highlightExp: `$store.displaySettings.darkModeIsOn`,
            classStr: `text-xs border-2 text-nowrap`,
        })}
        <div x-data="{open:false}">
          ${button({
            icon: icons.swatchMini,
            title: 'Color Scheme',
            attrs: `
              :class="{['bg-'+color+'-500/100']: true}"
              x-ref="button"
              @click="open = !open"
              `,
              classStr: `text-xs border-2 text-nowrap`,
            })}
          <div 
          x-show="open" 
            x-anchor="$refs.button"
            @click.outside="open = false"
            :class="{['bg-'+color+'-500/10']: true}"
            class='mt-2 flex gap-2 p-2 border-2 border-gray-500/50 rounded'
          >
            ${Alpine.store('displaySettings').colorOptions.map(color => {
              return button({
                attrs: `
                  :class="{
                    ['bg-${color}-500/100']: true,
                    ['border-gray-950 dark:border-gray-50']: color == '${color}',
                    ['border-gray-500/50']: color != '${color}',
                  }"
                  @click="$store.displaySettings.changeColorScheme('${color}')"
                `,
                classStr: `size-8 border-2`,
              })
            }).join('\n')}
            </div>
          </div>
        </div>
      </div>
    </div>
  `
}