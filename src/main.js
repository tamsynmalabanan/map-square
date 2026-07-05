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

Alpine.start()