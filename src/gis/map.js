import Alpine from 'alpinejs';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import * as utils from '../utils.js'; 
import * as gisUtils from './utils.js'; 

const defaultConfig = {
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
  },
  themes: [{
    active: true,
    id: utils.randomId(),
    settings: {
      locked: true,
      unit: 'metric',
      precision: 1000000,
      projection: 'mercator',
      terrain: false,
      bookmark: {
        extents: [{
          active: true,
          name: 'centroid',
          title: 'Centroid',
          params: {
            zoom: 1,
            lng: 0,
            lat: 3,
          },
        }, {
          active: false,
          name: 'bbox',
          title: 'Bounding Box',
          params: {
            w: -140,
            s: -70,
            e: 160,
            n: 90,
            padding: 0,
            maxZoom: 1,
          }
        }],
        pitch: 0,
        bearing: 0,
      },  
      basemap: {
        render: true,
        theme: 'auto',
        color: 'auto',
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
              'raster-opacity': 1, // 0 to 1
              'raster-hue-rotate': 0, // 0 to 360
              'raster-brightness-min': 0, // 0 to 1
              'raster-brightness-max': 0.005, // 0 to 1
              'raster-saturation': -1, // -1 to 1
              'raster-contrast': 0.995, // -1 to 1
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
    },
    metadata: {
      title: 'Untitled Map',
      abstract: '',
      author: '',
    },
    legend: [] 
    // legend should be a nested array and objects of groups and layers
    // [
    //   {
    //     type: 'group', 
    //     params: {
    //       title: '', 
    //       contents: [
    //         {
    //           type: 'group',
    //           params: {
    //             title: '',
    //             contents: [
    //               {
    //                 type: 'layer',
    //                 params: {
    //                   title: '',
    //                 }
    //               }
    //             ]
    //           }
    //         },
    //         {
    //           type: 'layer',
    //           params: {
    //             title: ''
    //           }
    //         }
    //       ]
    //     }
    //   }
    // ]
  }]
}

export default class Map extends maplibregl.Map {
  constructor(container, config=null) {
    const cloneConfig = structuredClone(defaultConfig)
    const cloneTheme = cloneConfig.themes[0]
    const cloneSettings = cloneTheme.settings
    const cloneCentroid = cloneSettings.bookmark.extents.find(props => props.name == 'centroid')

    config ??= cloneConfig

    let theme = (config.themes ??= []).find(theme => theme.active)
    if (!theme) {
      theme = config.themes[0] ??= cloneTheme
      theme.active = true
    }

    const settings = theme.settings ??= cloneSettings
    const bookmark = settings.bookmark ??= cloneSettings.bookmark
    
    let extent = (bookmark.extents ??= cloneSettings.bookmark.extents).find(props => props.active)
    if (!extent) {
      extent = bookmark.extents[0] ??= cloneSettings.bookmark.extents[0]
      extent.active = true

      const extentNames = bookmark.extents.map(props => props.name)
      cloneSettings.bookmark.extents.forEach(props => {
        if (!extentNames.includes(props.name)) {
          props.active = false
          bookmark.extents.push(props)
        }
      })
    }

    const basemap = settings.basemap ??= cloneSettings.basemap
    basemap.render ??= cloneSettings.basemap.render
    basemap.theme ??= cloneSettings.basemap.theme
    
    let paints = (basemap.paints ??= cloneSettings.basemap.paints)[(basemap.theme == 'dark' || (
      basemap.theme == 'auto' && Alpine.store('displaySettings').darkModeIsOn
    )) ? 'dark' : 'default']
    if (!paints) {
      basemap.theme = Object.keys(basemap.paints)[0] ?? Object.keys(cloneSettings.basemap.paints)[0]
      paints = basemap.paints[basemap.theme] ??= cloneSettings.basemap.paints[basemap.theme]

      Object.entries(cloneSettings.basemap.paints).forEach(([name, props]) => {
        if (!(name in basemap.paints)) {
          basemap.paints[name] = props
        }
      })
    }

    const sources = config.sources ??= cloneConfig.sources
    sources.basemap ??= cloneConfig.sources.basemap
    sources.terrain ??= cloneConfig.sources.terrain

    const options = {
      container,
      pitch: bookmark.pitch ??= cloneSettings.bookmark.pitch,
      bearing: bookmark.bearing ??= cloneSettings.bookmark.bearing,
      ...(extent.name == 'centroid' ? {
        zoom: extent.params.zoom ??= cloneCentroid.params.zoom,
        center: Array('lng', 'lat').map(i => extent.params[i] ??= cloneCentroid.params[i]),
      } : {}),
      maxZoom: 22,
      maxPitch: 75,
      interactive: !(settings.locked ??= cloneSettings.locked),
      hash: false,
      style: {
        version: 8,
        sources,
        ...(basemap.render ? {
          layers: [{
            id: 'basemap',
            type: 'raster',
            source: 'basemap',
            paint: paints.basemap
          }],
          sky: paints.sky
        } : {})
      },
    }

    super(options);

    this.on('load', () => {

    })

    this.config = config
    this.theme = theme

    this.configAddLayer()
    this.configRemoveLayer()
    this.configFitBounds()
    
    window.map = this
  }
  
  static normalizeConfig() {

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

  configFitBounds() {
    const originalFitBounds = this.fitBounds.bind(this)

    this.fitBounds = (bounds, options) => {
      if (this.theme.settings.locked) {
        return alert('map view is locked.')
      }
      return originalFitBounds(bounds, options)
    }
  }

  getBbox() {
    return this.getBounds().toArray().flatMap(i => i)
  }
}