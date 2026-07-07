import map from './templates/map.js'; 
import button from './templates/button.js';
import tabs from './templates/tabs.js'; 
import modal from './templates/modal.js'; 
import {default as dashboardOptions} from './components/dashboard/options.js'; 


export default function registerLayout() {
    const app = document.querySelector('#app');

    app.appendChild(utils.strToEl(map()))

    app.appendChild(utils.strToEl(modal({
        open: false,
        title: 'Dashboard',
        classStr: "absolute bottom-0 left-0 m-[10px]",
        icon: icons.walletSolid,
        origin: 'bottom.left',
        collapsible: true,
        content: tabs({active: 0, tabs:[
            {title: 'Maps', icon: icons.mapMini, content: 'map content'},
            {title: 'Options', icon: icons.adjustmentsHorizontalMini, content: dashboardOptions()},
        ]})
    })))
}