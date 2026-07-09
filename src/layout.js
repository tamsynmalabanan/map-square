import map from './templates/map.js'; 
import button from './templates/button.js';
import tabs from './templates/tabs.js'; 
import modal from './templates/modal.js'; 
import {default as dashboardOptions} from './components/dashboard/options.js'; 


export default function registerLayout() {
    const app = document.querySelector('#app');

    // NOTE: if there are get params for source and url, check firts if source-url config is already in indexeddb else download
    const config = {}
    app.appendChild(utils.strToEl(map({config})))

    app.appendChild(utils.strToEl(modal({
        open: false,
        title: 'Dashboard',
        classStr: "absolute bottom-0 left-0 m-[10px]",
        icon: svg.walletSolid,
        origin: 'bottom.left',
        collapsible: true,
        content: tabs({active: 0, tabs:[
            {label: 'Maps', icon: svg.mapMini, content: 'map content'},
            {label: 'Options', icon: svg.adjustmentsHorizontalMini, content: dashboardOptions()},
        ]})
    })))
}