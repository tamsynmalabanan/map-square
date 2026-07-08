import Alpine from 'alpinejs';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import * as utils from '../utils.js'; 

const defaultSettings = {
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
}

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
    settings: structuredClone(defaultSettings),
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
  constructor(container, config) {
    if (!config) {
      config = structuredClone(defaultConfig)
    }

    const theme = config.themes.find(theme => theme.active)
    const settings = theme.settings

    const bookmark = settings.bookmark
    const extent = bookmark.extents.find(props => props.active)

    const basemap = settings.basemap
    const paints = basemap.paints[(basemap.theme == 'dark' || (
      basemap.theme == 'auto' && Alpine.store('displaySettings').darkModeIsOn
    )) ? 'dark' : 'default']
    
    const options = {
      container,
      pitch: bookmark.pitch,
      bearing: bookmark.bearing,
      ...(extent.name == 'centroid' ? {
        zoom: extent.params.zoom,
        center: Array('lng', 'lat').map(i => extent.params[i]),
      } : {}),
      maxZoom: 22,
      maxPitch: 75,
      interactive: !settings.locked,
      hash: false,
      style: {
        version: 8,
        sources: config.sources,
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
    this.config = config
  }
}