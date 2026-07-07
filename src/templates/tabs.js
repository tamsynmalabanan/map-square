import Alpine from 'alpinejs';
import button from './button.js'; 

Alpine.data('tabsApp', ({
  active=0,
  tabs=[]
}={}) => ({
  active,
  tabs,
}))

export default ({
  active=0,
  tabs=[],
}={}) => {
  return `
      <div 
        x-id="['tabs']" 
        :id="$id('tabs')" 
        x-data='tabsApp(${JSON.stringify({active})})'
        class="flex flex-col gap-4 grow"
      >
        <div 
          :id="$id('tabs', 'toggles')" 
          class="flex justify-start items-center gap-2"
        >
          ${tabs.map((tab, index) => button({
              icon: tab.icon,
              title: tab.title,
              collapsible: true,
              attrs: `:id="$id('tabs', 'toggles')+'-'+${index}" @click="active = ${index}"`,
              highlightExp: `active == ${index}`,
          })).join('\n')}
        </div>
        <div 
          :id="$id('tabs', 'contents')"
          :class="{
            ['bg-'+color+'-500/10']: true,
          }"
          class="flex flex-col grow p-5 rounded"
        >
          ${tabs.map((tab, index) => `
            <div 
                :id="$id('tabs', 'contents')+'-'+${index}" 
                x-show="active == ${index}"
            >${tab.content}</div>  
          `).join('\n')}
        </div>
      </div>
    `
}