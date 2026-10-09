import Alpine from 'alpinejs';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import * as utils from '../../utils.js'; 
import * as gisUtils from '../utils.js'; 
import HandleControls from './controls.js';
import * as turf from '@turf/turf'
import { getGISDBKeys } from '../db.js';
import _, { before } from 'lodash';

export default class Map extends maplibregl.Map { 
  constructor(container, config=null) {
    const mask = Map.setMask(container)

    config = Map.normalizeConfig(config)

    const options = {
      container,
      maxZoom: 22,
      maxPitch: 75,
      hash: false,
      attributionControl: false,
      preserveDrawingBuffer: true,
      style: {
        version: 8,
        sources: config.sources,
        layers: []
      },
    }

    super(options)

    this.once('idle', (e) => {
      mask.remove()
    })

    this.on('load', () => {
      new HandleControls(this)
    })

    this.getConfig = () => config
    
    this.getTheme = () => {
      const themes = config.themes
      if (!themes?.length) return

      let theme = themes.find(i => i.id === config.activeTheme)
      if (!theme) {
        theme = themes[0]
        config.activeTheme = theme.id
      }
   
      return theme
    }

    this.configAddSource()
    this.configRemoveSource()
    this.configAddLayer()
    this.configRemoveLayer()
    this.configMoveLayer()
    this.configSetProjection()
    this.configMovementFns()

    window.map = this
  }

  static async create(container, params=null) {
    let config

    const {src, id} = params
    
    if (src === 'db') {
      if ((await gisDB.getGISDBKeys('maps')).includes(id)) {
        config = await gisDB.getFromGISDB('maps', id)
      }
    } else {
      if (config) {
        config.id = id
        config.src = src
      }
    }

    if (!config) {
      window.history.replaceState({}, '', new URL(utils.getBaseURL(window.location.href)))
    }

    return new Map(container, config)
  }
  
  static getDefaultConfig() {
    const date = (new Date()).toLocaleString("en-US")
    const displaySettings = Alpine.store('displaySettings')
    const themeId = utils.randomId()

    return {
      id: null,
      src: null,
      autosave: false,
      activeTheme: themeId,
      metadata: {
        snapshot: '',
        title: 'Untitled Map',
        
        logo: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==',
        creator: '',
        website: '',
        email: '',
        
        license: '', // 'CC BY-SA 4.0',
        acknowledgements: '',
        
        description: '',
        references: null,
        
        dateCreated: date,
        dateUpdated: null,
      },
      sources: {
        basemap: {
          type: 'raster',
          tileSize: 256,
          maxzoom: 20,
          tiles: ['https://a.tile.openstreetmap.org/{z}/{x}/{y}.png'],
          attribution: '&copy; OpenStreetMap Contributors',
        },
        terrain: {
            type: 'raster-dem',
            tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: 'Terrain Tiles © Mapzen, <a href="https://registry.opendata.aws/terrain-tiles/" target="_blank">Registry of Open Data on AWS</a>',
            encoding: 'terrarium' 
        },
        placeSearch: {
          type: 'geojson',
          data: turf.featureCollection([]),
          attribution: '&copy; OpenStreetMap Contributors',
        },
        tooltip: {
          type: 'geojson',
          data: turf.featureCollection([])
        },
        info: {
          type: 'geojson',
          data: turf.featureCollection([])
        },
      },
      themes: [{
        id: themeId,
        metadata: {
          title: 'Untitled Theme',
          description: '',
          dateCreated: date,
          dateUpdated: null,
        },
        settings: {
          locked: false,
          unit: 'metric', // metric, imperial, nautical
          precision: 1000000,
          projection: 'mercator', // mercator or globe,
          terrain: false,
          geolocate: false,
          colorTheme: displaySettings.colorTheme,
          bookmark: {
            active: 'centroid',
            view: {
              pitch: 0,
              bearing: 0,
              zoom: 2,
              lng: 0,
              lat: 15,
              west: -140,
              south: -70,
              east: 160,
              north: 90,
            },
            maxZoom: 22,
            padding: 0,
            duration: 0,
          },  
          basemap: {
            render: true,
            paints: {
              default: {
                basemap: {
                  'raster-resampling': 'linear',
                  'raster-opacity': 1,
                  'raster-hue-rotate': 0,
                  'raster-brightness-min': 0,
                  'raster-brightness-max': 1,
                  'raster-saturation': 0,
                  'raster-contrast': 0,
                },
                sky: {
                  "sky-color": "#88c6fc",
                  "horizon-color": "#ffffff",
                  "fog-color": "#ffffff",
                  "fog-ground-blend": 0.5,
                  "horizon-fog-blend": 0.8,
                  "sky-horizon-blend": 0.8,
                  "atmosphere-blend": 0.8 
                },
              },
              dark: {
                basemap: {
                  'raster-resampling': 'linear',
                  'raster-opacity': 1,
                  'raster-hue-rotate': 0,
                  'raster-brightness-min': 0,
                  'raster-brightness-max': 0.01,
                  'raster-saturation': -0.75,
                  'raster-contrast': 0.975,
                },
                sky: {
                  "sky-color": "#02294b",
                  "horizon-color": "#808080",
                  "fog-color": "#808080",
                  "fog-ground-blend": 0.5,
                  "horizon-fog-blend": 0.8,
                  "sky-horizon-blend": 0.8,
                  "atmosphere-blend": 0.8
                }
              },
            }
          },
          hillshade: {
            render: true,
            active: 'standard',
            methods: {
              standard: {
                title: 'Standard',
                params: {
                  'hillshade-illumination-direction': 315,
                  'hillshade-illumination-altitude': 45,
                  'hillshade-highlight-color': '#FFFFFF',
                  'hillshade-shadow-color': '#000000',
                }
              },
              multi: {
                title: 'Multidirectional',
                params: {
                  'hillshade-illumination-direction': [315, 45, 135, 225],
                  'hillshade-illumination-altitude': [45, 45, 45, 45],
                  'hillshade-highlight-color': [
                    '#ff0000',
                    '#80ff00',
                    '#00ffff',
                    '#7f00ff',
                  ],
                  'hillshade-shadow-color': [
                    '#503030',
                    '#405030',
                    '#305050',
                    '#403050',
                  ],
                }
              },
            },
            exaggeration: 0.1,
            accent: '#000000',
          },
          popups: {
            tooltip: {
              active: true,
            },
            info: {
              active: true,
              data: {
                layers: true,
                osm: true,
              }
            }
          },
        },
        layers: [] 
      }],
    }
  }

  static normalizeConfig(config) {
    const cloneConfig = Map.getDefaultConfig()
    
    if (!config) {
      return cloneConfig
    }

    const sources = config.sources ??= cloneConfig.sources
    sources.basemap ??= cloneConfig.sources.basemap
    sources.terrain ??= cloneConfig.sources.terrain

    config.controls ??= cloneConfig.controls

    const cloneTheme = cloneConfig.themes.find(i => i.id === cloneConfig.activeTheme)
    const cloneSettings = cloneTheme.settings
    const cloneBookmark = cloneSettings.bookmark

    const themes = config.themes ??= []
    let activeTheme = themes.find(theme => theme.id === config.activeTheme)
    if (!activeTheme) {
      activeTheme = themes[0] ??= cloneTheme
      config.activeTheme = activeTheme.id
    }

    themes.forEach(theme => {
      const settings = theme.settings ??= cloneSettings
      Array(
        'locked',
        'unit',
        'precision',
        'projection',
        'terrain',
        'geolocate',
        'colorTheme'
      ).forEach(i => {
        settings[i] ??= cloneSettings[i]
      })

      const bookmark = settings.bookmark
      if (bookmark) {
        Array('active', 'maxZoom', 'padding', 'duration').forEach(i => {
          bookmark[i] ??= cloneBookmark[i]
        })
  
        const view = bookmark.view
        if (view) {
          Object.entries(cloneBookmark.view).forEach(([k,v]) => {
            view[k] ??= v
          })
        } else {
          bookmark.view = cloneBookmark.view
        }
      } else {
        settings.bookmark = cloneBookmark
      }
  
      const basemap = settings.basemap ??= cloneSettings.basemap
      basemap.render ??= cloneSettings.basemap.render
      basemap.color ??= cloneSettings.basemap.color
      
      const basemapTheme = Alpine.store('displaySettings').darkTheme ? 'dark' : 'default'
      const paints = basemap.paints[basemapTheme]
      if (paints && Object.keys(basemap.paints).includes(basemapTheme)) {
        paints.basemap ??= cloneSettings.basemap.paints[basemapTheme].basemap
        paints.sky ??= cloneSettings.basemap.paints[basemapTheme].sky
      } else {
        basemap.paints = cloneSettings.basemap.paints
      }
    })

    return config
  }

  static setMask(container) {
    const mask = document.createElement('div')
    mask.classList.add(
      'w-full!', 'h-full!', 
      'bg-gray-950/25!', 
      'absolute', 'top-0', 'left-0', 'overflow-hidden',
      'flex', 'justify-center', 'align-middle', 'text-center'
    )
    container.parentElement.appendChild(mask)

    const spinner = utils.strToEl(svg.spinner)
    utils.appendBinding(spinner, ':class', `['text-'+color+'-200/100! dark:text-'+color+'-950/100!']: true`)
    spinner.classList.add('size-[5vw]!', 'self-center!')
    mask.appendChild(spinner)

    return mask
  }

  configAddSource() {
    const original = this.addSource.bind(this)

    this.addSource = (sourceId, params) => {
      const source = original(sourceId, params)
      this.fire('sourceadded', { source })
      return source
    }
  }

  configRemoveSource() {
    const original = this.removeSource.bind(this)

    this.removeSource = (sourceId) => {
      const result = original(sourceId)
      this.fire('sourceremoved', { sourceId })
      return result
    }
  }

  configAddLayer() {
    const originalAddLayer = this.addLayer.bind(this)

    this.addLayer = (layer, beforeId) => {
      const result = originalAddLayer(layer, beforeId)
      this.fire('layeradded', { layer, beforeId })
      return result
    }
  }

  configRemoveLayer() {
    const originalRemoveLayer = this.removeLayer.bind(this)

    this.removeLayer = (layerId) => {
      const layer = this.getLayer(layerId)
      const result = originalRemoveLayer(layerId)
      this.fire('layerremoved', { layerId, layer })
      
      // if (!this.getControls('layers').getAllSystemSources().find(i => layerId.startsWith(i))) {
      //   const sourceId = layer.source
      //   if (!this.getConfig().themes.find(i => i.layers.find(j => j.source === sourceId))) {
      //     this.removeSource(sourceId)
      //   }
      // }

      return result
    }
  }

  configMoveLayer() {
    const original = this.moveLayer.bind(this)

    this.moveLayer = (layerName, beforeId) => {
      beforeId = this.getControls('layers').getBeforeId(layerName, beforeId)

      const results = (
        this.getStyle().layers.map(l => l.id)
        .filter(id => id.startsWith(layerName))
        .map(id => original(id, beforeId))
      )

      this.fire('layermoved', { layerName, beforeId, results })

      return results
    }
  }

  configSetProjection() {
    const original = this.setProjection.bind(this)

    this.setProjection = (options) => {
      if (options.type === this.getStyle().projection?.type) return
      
      const result = original(options)
      
      this.fire('projectionchanged', { options, result })
      
      return result
    }
  }

  configMovementFns() {
    Array(
      'fitBounds',
      'setZoom',
      'setCenter',
      'setPitch',
      'setBearing',
      'zoomIn',
      'zoomOut',
    ).forEach(i => {
      const original = this[i].bind(this)
  
      this[i] = (value, options) => {
        if (Alpine.$data(this.getContainer()).locked) {
          throw new Error('Map is locked')
        } else {
          return original(value, options)
        }
      }
    })
  }

  getBbox() {
    return this.getBounds().toArray().flatMap(i => i)
  }

  getNormalizedBbox() {
    return gisUtils.normalizeBbox(this.getBbox())
  }

  getView() {
    const {lng, lat} = this.getCenter()
    const [west, south, east, north] = this.getBbox()
    return {
      pitch: this.getPitch(),
      bearing: this.getBearing(),
      zoom: this.getZoom(),
      lng,
      lat,
      west,
      south,
      east,
      north,
    }
  }

  isStaticConfig() {
    const config = this.getConfig()
    return config.id && config.src !== 'db'
  }
  
  isWebConfig() {
    const config = this.getConfig()
    return config.id && !Array('db', 'file').includes(config.src)
  }

  getScaleInMeters() {
    const control = this.getControls('scalebar')
    const innerText = control.getContainer().innerText
    const numValue = parseFloat(innerText)
    const unit = innerText.split(numValue).pop().trim()
    
    if (control.options.unit === 'metric') {
        if (unit === 'm') return numValue
        if (unit === 'km') return numValue * 1000
    }
    
    if (control.options.unit === 'imperial') {
        if (unit === 'mi') return numValue * 1609.344
        if (unit === 'ft') return numValue * 0.3048
    }
    
    if (control.options.unit === 'nautical') {
        if (unit === 'nm') return numValue * 1852
    }
    
    throw new Error(`Unsupported scale: ${unit}`)
  }
}