import map from './templates/map.js'; 
import button from './templates/button.js';
import tabs from './templates/tabs.js'; 
import modal from './templates/modal.js'; 
import dashboardOptions from './components/dashboardOptions.js'; 


export default function registerLayout() {
    const app = document.querySelector('#app');

    app.appendChild(utils.strToEl(map()))

    app.appendChild(utils.strToEl(modal({
        open: true,
        title: 'Dashboard',
        classStr: "absolute bottom-0 left-0 m-4",
        icon: icons.walletSolid,
        origin: 'bottom.left',
        collapsible: true,
        content: tabs({active: 1, tabs:[
            {title: 'Maps', icon: icons.mapMini, content: 'map content'},
            {title: 'Options', icon: icons.adjustmentsHorizontalMini, content: dashboardOptions()},
        ]})
    })))
}