import map from './templates/map.js'; 
import button from './templates/button.js';
import tabs from './templates/tabs.js'; 
import modal from './templates/modal.js'; 
import dashboardOptions from './components/dashboardOptions.js'; 

window.app = document.querySelector('#app');

export default function registerLayout() {
    app.appendChild(utils.strToEl(map()))

    app.appendChild(utils.strToEl(modal({
        open: true,
        title: 'Dashboard',
        classStr: "absolute bottom-0 left-0 m-4",
        icon: icons.dashboard,
        origin: 'bottom.left',
        collapsible: true,
        content: tabs({tabs:[
            {title: 'Maps', content: 'map content', icon: icons.map},
            {title: 'Options', icon: icons.options, content: dashboardOptions()},
        ]})
    })))
}