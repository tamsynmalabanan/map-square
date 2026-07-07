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
          attrs: `@click="$store.colorScheme.toggleDarkMode()"`,
          highlightExp: `$store.colorScheme.darkModeIsOn`,
        })}
    </div>
  `
}