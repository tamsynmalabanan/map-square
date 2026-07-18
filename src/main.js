import './style.css'

import * as utils from './utils.js'; 
window.utils = utils;

import * as gisDB from './gis/db.js'; 
window.gisDB = gisDB;

import * as gisUtils from './gis/utils.js'; 
window.gisUtils = gisUtils;

import * as svg from './svg.js'; 
window.svg = svg;

import Alpine from 'alpinejs'
window.Alpine = Alpine;

import persist from '@alpinejs/persist'
Alpine.plugin(persist)

import anchor from '@alpinejs/anchor'
Alpine.plugin(anchor)

import registerStores from './stores.js'
registerStores()

import registerData from './data.js'
registerData()

import registerLayout from './layout.js'
registerLayout()

Alpine.start()