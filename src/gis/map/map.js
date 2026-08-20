import Alpine from 'alpinejs';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import * as utils from '../../utils.js'; 
import * as gisUtils from '../utils.js'; 
import HandleControls from './controls.js';
import * as turf from '@turf/turf'
import { getGISDBKeys } from '../db.js';

export default class Map extends maplibregl.Map { 
  constructor(container, config=null) {
    config = Map.normalizeConfig(config)
    
    const theme = config.themes.find(theme => theme.active) || config.themes[0]
    theme.active = true

    const options = {
      container,
      maxZoom: 22,
      maxPitch: 75,
      hash: false,
      attributionControl: false,
      style: {
        version: 8,
        sources: structuredClone(config.sources),
        layers: structuredClone(theme.layers)
      },
    }

    super(options);

    this.on('load', () => {
      this.handlers['handleControls'] = new HandleControls(this)
    })

    this._ms = {config, theme, controls: {}}

    this.configAddSource()
    this.configRemoveSource()
    this.configAddLayer()
    this.configRemoveLayer()
    this.configMovementFns()
    
    window.map = this
  }

  static async create(container, params=null) {
    let config

    console.log(params)
    if (params.source && params.id) {
      const localMaps = await gisDB.getGISDBKeys('maps')
      console.log(localMaps)

      // if source is not local remove id
    }

    return new Map(container, config)
  }
  
  static getDefaultConfig() {
    const date = (new Date()).toDateString()

    return {
      autosave: false,
      metadata: {
        title: 'Untitled Map',
        abstract: '',
        author: 'Unknown Author',
        dateCreated: date,
        dateUpdated: date,
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
      themes: [{
        id: utils.randomId(),
        active: true,
        settings: {
          locked: false,
          unit: 'metric', // metric, imperial, nautical
          precision: 1000000,
          projection: 'mercator', // mercator or globe,
          terrain: false,
          bookmark: {
            active: 'centroid',
            extents: {
              centroid: {
                title: 'Centroid',
                params: {
                  zoom: 1,
                  lng: 0,
                  lat: 3,
                },
              },
              bbox: {
                title: 'Bounding Box',
                params: {
                  w: -140,
                  s: -70,
                  e: 160,
                  n: 90,
                  padding: 0,
                  maxZoom: 22,
                }
              }
            },
            pitch: 0,
            bearing: 0,
          },  
          basemap: {
            render: true,
            theme: 'auto',
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
            methods: [{
              active: true,
              name: 'standard',
              title: 'Standard',
              params: {
                'hillshade-illumination-direction': 315,
                'hillshade-illumination-altitude': 45,
                'hillshade-highlight-color': '#FFFFFF',
                'hillshade-shadow-color': '#000000',
              }
            }, {
              active: false,
              name: 'multi',
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
            }],
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
          controls: {}
        },
        metadata: {
          title: 'Untitled Theme',
          abstract: '',
          author: '',
          dateCreated: date,
          dateUpdated: date,
        },
        layers: [] 
      }]
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

    const cloneTheme = cloneConfig.themes.find(theme => theme.active)
    const cloneSettings = cloneTheme.settings
    const cloneCentroid = cloneSettings.bookmark.extents.centroid

    let theme = (config.themes ??= []).find(theme => theme.active)
    if (!theme) {
      theme = config.themes[0] ??= cloneTheme
      theme.active = true
    }

    const settings = theme.settings ??= cloneSettings
    settings.locked ??= cloneSettings.locked

    const bookmark = settings.bookmark ??= cloneSettings.bookmark
    bookmark.pitch ??= cloneSettings.bookmark.pitch
    bookmark.bearing ??= cloneSettings.bookmark.bearing
    
    const extent = bookmark.extents[bookmark.active]
    if (extent) {
      const centroidExtent = bookmark.extents.centroid
      if (centroidExtent) {
        centroidExtent.params.zoom ??= cloneCentroid.params.zoom
        Array('lng', 'lat').forEach(i => centroidExtent.params[i] ??= cloneCentroid.params[i])
      } else {
        bookmark.extents['centroid'] = cloneCentroid
      }
    } else {
      bookmark.extents = cloneSettings.bookmark.extents
    }

    const basemap = settings.basemap ??= cloneSettings.basemap
    basemap.render ??= cloneSettings.basemap.render
    basemap.theme ??= cloneSettings.basemap.theme
    basemap.color ??= cloneSettings.basemap.color
    
    const basemapTheme = Map.getTheme(basemap.theme)
    const paints = basemap.paints[basemapTheme]
    if (paints && Object.keys(basemap.paints).includes(basemapTheme)) {
      paints.basemap ??= cloneSettings.basemap.paints[basemapTheme].basemap
      paints.sky ??= cloneSettings.basemap.paints[basemapTheme].sky
    } else {
      basemap.theme = cloneSettings.basemap.theme
      basemap.paints = cloneSettings.basemap.paints
    }

    return config
  }

  static getTheme(theme) {
    return (theme == 'dark' || (
      theme == 'auto' && Alpine.store('displaySettings').darkMode
    )) ? 'dark' : 'default'
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
        if (this._ms.theme.settings.locked) {
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

  getView() {
    const center = this.getCenter()
    const bounds = this.getBounds()
    return {
        zoom: this.getZoom(),
        lng: center.lng,
        lat: center.lat,
        w: bounds.getWest(),
        s: bounds.getSouth(),
        e: bounds.getEast(),
        n: bounds.getNorth(),
        pitch: this.getPitch(),
        bearing: this.getBearing()
    }
  }

  lock() {
    this.scrollZoom.disable();
    this.doubleClickZoom.disable();
    this.dragPan.disable();
    this.keyboard.disable();
    this.touchZoomRotate.disable();
  }

  unlock() {
    this.scrollZoom.enable();
    this.doubleClickZoom.enable();
    this.dragPan.enable();
    this.keyboard.enable();
    this.touchZoomRotate.enable();
  }

  updateConfig(property, value, {theme}={}) {
    const config = this._ms.config

    let target = theme || config

    property.slice(0, -1).forEach(name => {
      target = target[name]
    })

    const propertyName = property[property.length-1]
    if (target[propertyName] === value) return

    target[propertyName] = value

    const date = (new Date()).toDateString()
    config.metadata.dateUpdated = date
    if (theme) {
      theme.metadata.dateUpdated = date
    }

    if (config.autosave) {
      console.log('autosave config to indexdb')
    }
  }
}