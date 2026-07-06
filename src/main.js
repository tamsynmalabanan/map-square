import './style.css'

import Alpine from 'alpinejs'
window.Alpine = Alpine;

import * as utils from './utils.js';
window.utils = utils;

const app = document.querySelector('#app')
window.app = app;

import map from './components/map.js';
window.mapApp = map;
app.appendChild(utils.templateToElement(mapApp().template))

import modal from './components/modal.js';
window.modalApp = modal;
const dashboardModal = utils.templateToElement(modalApp({
    containerClass: 'absolute bottom-0 left-0 m-4',
    toggleHTML: `<div class="border rounded p-1">Dashboard</div>`,
    modalTitle: 'Dashboard'
}).template)
app.appendChild(dashboardModal)

Alpine.start()