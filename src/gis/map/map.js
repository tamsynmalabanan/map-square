import Alpine from 'alpinejs';
import maplibregl, { Padding } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import * as utils from '../../utils.js'; 
import * as gisUtils from '../utils.js'; 
import HandleControls from './controls.js';
import * as turf from '@turf/turf'
import { getGISDBKeys } from '../db.js';
import _, { before } from 'lodash';

export default class Map extends maplibregl.Map { 
  constructor(container, config=null) {
    config = Map.normalizeConfig(config)

    const options = {
      container,
      maxZoom: 22,
      maxPitch: 75,
      hash: false,
      attributionControl: false,
      style: {
        version: 8,
        sources: config.sources,
        layers: []
      },
    }

    super(options)

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

    this.on('data', (e) => {
      if (e.dataType === 'source' && e.source.type === 'geojson') {
        this.fire('geojsonupdated', {sourceId: e.sourceId, source: e.source})
      }
    })

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
        title: 'Untitled Map',
        
        logo: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==',
        creator: 'Unknown',
        website: '',
        email: '',
        license: 'CC BY-SA 4.0',
        acknowledgements: '',

        description: '',
        references: null,
        
        dateCreated: date,
        dateUpdated: null,
        dateSaved: null,
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
          data: turf.featureCollection([])
        }
      },
      controls: {
          metadata: {
            active: true,
            position: 'top-left',
            order: 0,
          },
          legend: {
            active: true,
            position: 'top-left',
            order: 1,
          },

          placeSearch: {
            active: true,
            position: 'top-right',
            order: 1,
          },
          nav: {
            active: true,
            position: 'top-right',
            order: 2,
            options: {
                visualizePitch: true,
                showZoom: true,
                showCompass: true,
            },
          },
          fitToWorld: {
            active: true,
            position: 'top-right',
            order: 4,
          },
          bookmark: {
            active: true,
            position: 'top-right',
            order: 5,
          },
          geolocate: {
            active: true,
            position: 'top-right',
            order: 6,
            options: {
                positionOptions: {
                    enableHighAccuracy: true
                },
                trackUserLocation: true,
                showUserHeading: true,
                fitBoundsOptions: { maxZoom: 16 }
            },
          },
          fullscreen: {
            active: true,
            position: 'top-right',
            order: 7,
          },
          
          file: {
            active: true,
            position: 'bottom-right',
            order: 5,
          },
          settings: {
            active: true,
            position: 'bottom-right',
            order: 4,
          },
          terrain: {
            active: true,
            position: 'bottom-right',
            order: 3,
            options: {
                source:'terrain',
                exaggeration:1,
            },
          },
          scalebar: {
            active: true,
            position: 'bottom-right',
            order: 2,
            options: {
                unit: 'metric',
                maxWidth: 200,
            }
          },
          attribution: {
            active: true,
            position: 'bottom-right',
            order: 1,
            options: {
                compact: true,
                customAttribution: '',
            },
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
          darkMode: displaySettings.darkMode,
          colorTheme: displaySettings.colorTheme,
          bookmark: {
            active: 'centroid',
            view: {
              pitch: 0,
              bearing: 0,
              zoom: 1,
              lng: 0,
              lat: 3,
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
          interactions: {
            tooltip: {
              active: true,
            },
            popup: {
              active: true,
              targets: {
                layers: true,
                osm: true,
                elevation: true,
              }
            }
          },
        },
        layers: [] 
      }],
      logs: []
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
        'darkMode',
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
      
      const basemapTheme = settings.darkMode ? 'dark' : 'default'
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
      this.fire('layeradded', { layer })
      return result
    }
  }

  configRemoveLayer() {
    const originalRemoveLayer = this.removeLayer.bind(this)

    this.removeLayer = (layerId) => {
      const result = originalRemoveLayer(layerId)
      this.fire('layerremoved', { layerId })
      return result
    }
  }

  configMoveLayer() {
    const original = this.moveLayer.bind(this)

    this.moveLayer = (layerName, beforeId) => {
      beforeId = this.getControls('legend').getBeforeId(layerName, beforeId)

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
      'setProjection',
    ).forEach(i => {
      const original = this[i].bind(this)
  
      this[i] = (value, options) => {
        if (this._locked) {
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
}