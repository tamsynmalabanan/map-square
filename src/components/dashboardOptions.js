import Alpine from 'alpinejs';
import button from '../templates/button.js'; 

Alpine.data('dashboardOptions', (options={}) => ({

}))

export default (options={}) => {
  return `
    <div x-data='dashboardOptions()'>
      ${button({
          icon: icons.moon,
          title: 'Toggle Dark Mode',
          attrs: `:class="{
            'bg-teal-500 dark:bg-teal-500': $store.darkMode.isOn,
            'bg-teal-50 dark:bg-teal-950': !$store.darkMode.isOn,
          }" @click="$store.darkMode.toggle()"`
      })}
    </div>
  `
}