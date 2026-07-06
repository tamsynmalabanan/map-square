import './style.css'

import * as utils from './utils.js'; 
window.utils = utils;

import * as icons from './icons.js'; 
window.icons = icons;

import Alpine from 'alpinejs'
window.Alpine = Alpine;

import persist from '@alpinejs/persist'
Alpine.plugin(persist)

import registerStores from './stores.js'
registerStores()

import registerLayout from './layout.js'
registerLayout()

Alpine.start()