import { indexOf } from "lodash"
import button from "../../templates/button.js"
import * as turf from '@turf/turf'
import dropdown from "../../templates/dropdown.js";
import Alpine from "alpinejs";

export class LayersControl {
    constructor(options) {
    }

    onAdd(map) {
        this._map = map
        
        const container = this._container = document.createElement('div')
        container.classList.add('maplibregl-ctrl','maplibregl-ctrl-group')
        return container
    }
    
    onRemove() {
        this._container.parentNode.removeChild(this._container);
        this._map = undefined;
    }

    getSystemOverlayNames() {
        return [
            'placeSearch',
            'info', 
            'tooltip', 
        ]
    }

    getBaseLayerNames() {
        return [
            'basemap',
            'hillshade', 
        ]
    }

    getAllSystemLayerNames() {
        return [...this.getBaseLayerNames(), ...this.getSystemOverlayNames()]
    }

    getGeometryFilters() {
        return Object.fromEntries(Array(
            'Polygon', 'LineString', 'Point'
        ).map(i => [i, ["==", "$type", i]]))
    }

    createPropertyFilter(property, {
        combinator='all', // 'all', 'any', 'none'
        operator='==', // "==", "!=", ">", "<", ">=", "<=", "has", "!has", "in", "!in"
        values=[],
    }={}) {
        return {combinator, properties: [{operator, property, values}]}
    }

    getFilterOperators() {
        return ["==", "!=", ">", ">=", "<", "<=", 'has', '!has', 'in', '!in']
    }

    // "==", "!=", ">", "<", ">=", "<=", "has", "!has", "in", "!in"
    // ["==", "highway", "primary"] 
    
    // "has", "!has"
    // ["has", "name"]
    
    // "in", "!in"
    // ["in", "class", "park", "forest"]

    // ["within", {"type": "Polygon", "coordinates": [...]}]
    //  - this wont work in filter so create a temp property defining spatial relationship with geom

    getBeforeId(layerName, beforeId) {
        const layerIds = this._map.getStyle().layers.map(l => l.id)
        
        if (typeof beforeId === 'string') {
            const layerIdMatch = layerIds.find(id => id.startsWith(beforeId))
            if (layerIdMatch) {
                return layerIdMatch
            }
        }

        let baseLayers = this.getBaseLayerNames()
        const baseIndex = baseLayers.indexOf(layerName)
        if (baseIndex !== -1) {
            baseLayers = baseLayers.splice(0, baseIndex+1)
            return layerIds.find(id => !baseLayers.includes(id))
        }

        let systemOverlays = this.getSystemOverlayNames()
        const overlayMatch = systemOverlays.find(i => layerName.startsWith(i))
        if (overlayMatch) {
            const overlayIndex = systemOverlays.indexOf(overlayMatch)
            systemOverlays = systemOverlays.splice(overlayIndex+1)
        }

        return layerIds.find(id => systemOverlays.find(i => id.startsWith(i)))
    }

    getDefaultVectorTypeParams({color=utils.randomColor()}={}) {
        const hsla = utils.hslaColor(color)
        const opacity = hsla.a
        const fillColor = hsla.toString({a:1})
        const haloColor = hsla.toString({l:Math.max(100,hsla.l*2),a:opacity/2})
        const outlineColor = hsla.toString({l:hsla.l*0.5, a:1})
        const sortKey = 0
        const antialias = true
        const pattern = null
        const translate = [0,0]
        const translateAnchor = 'map'
        const blur = 0
        const width = 2
        const visibility = 'visible'
        const allowOverlap = false
        const overlap = 'never' // never, always, cooperative
        const ignorePlacement = false
        const optional = false
        const rotate = 0
        const padding = 2 //[2]
        const offset = [0,0]
        const anchor = 'center' // center, left, right, top, bottom, top-left, top-right, bottom-left, bottom-right
        const alignment = 'auto'
        const minzoom = 0
        const maxzoom = 24

        return {
            'background': {
                type: 'background',
                minzoom,
                maxzoom,
                layout: {
                    visibility,
                },
                paint: {
                    'background-color': 'black',
                    'background-pattern': pattern,
                    'background-opacity': opacity/4,
                }
            },
            'fill': {
                type: 'fill',
                minzoom,
                maxzoom,
                layout: {
                    visibility,
                    'fill-sort-key': sortKey,
                },
                paint: {
                    'fill-antialias': antialias,
                    'fill-opacity': opacity/2,
                    'fill-color': fillColor,
                    'fill-outline-color': outlineColor,
                    'fill-translate': translate,
                    'fill-translate-anchor': translateAnchor,
                    'fill-pattern': pattern,
                }
            },
            'circle': {
                type: 'circle',
                minzoom,
                maxzoom,
                layout: {
                    visibility,
                    'circle-sort-key': sortKey,
                },
                paint: {
                    'circle-radius': 6,
                    'circle-color': fillColor,
                    'circle-blur': blur,
                    'circle-opacity': opacity,
                    'circle-translate': translate,
                    'circle-translate-anchor': translateAnchor,
                    'circle-pitch-scale': 'map',
                    'circle-pitch-alignment': 'viewport',
                    'circle-stroke-width': width,
                    'circle-stroke-color': outlineColor,
                    'circle-stroke-opacity': opacity,
                }
            },
            'heatmap': {
                type: 'heatmap',
                minzoom,
                maxzoom,
                layout: {
                    visibility,
                },
                paint: {
                    'heatmap-radius': 30,
                    'heatmap-weight': 1,
                    'heatmap-intensity': 1,
                    'heatmap-color': [
                        "interpolate",
                        ["linear"],
                        ["heatmap-density"],
                        0, hsla.toString({a:0}),
                        1, fillColor
                    ],
                    'heatmap-opacity': opacity,
                }
            },
            'fill-extrusion': {
                type: 'fill-extrusion',
                minzoom,
                maxzoom,
                layout: {
                    visibility,
                },
                paint: {
                    'fill-extrusion-opacity': opacity,
                    'fill-extrusion-color': fillColor,
                    'fill-extrusion-translate': translate,
                    'fill-extrusion-translate-anchor': translateAnchor,
                    'fill-extrusion-pattern': pattern,
                    'fill-extrusion-height': 10,
                    'fill-extrusion-base': 0,
                    'fill-extrusion-vertical-gradient': true,
                }
            },
            'line': {
                type: 'line',
                minzoom,
                maxzoom,
                layout: {
                    visibility,
                    'line-cap': 'butt',
                    'line-join': 'miter',
                    'line-miter-limit': 2,
                    'line-round-limit': 1.05,
                    'line-sort-key': sortKey,
                },
                paint: {
                    'line-opacity': opacity,
                    'line-color': fillColor,
                    'line-translate': translate,
                    'line-translate-anchor': translateAnchor,
                    'line-width': width,
                    'line-gap-width': 0,
                    'line-offset': 0,
                    'line-blur': blur,
                    'line-dasharray': null,
                    'line-pattern': pattern,
                    'line-gradient': null,
                }
            },
            'symbol': {
                type: 'symbol',
                minzoom,
                maxzoom,
                layout: {
                    visibility,
                    'symbol-placement': 'point',
                    'symbol-spacing': 250,
                    'symbol-avoid-edges': false,
                    'symbol-sort-key': sortKey,
                    'symbol-z-order': 'auto',
                    
                    'icon-allow-overlap': allowOverlap,
                    'icon-overlap': overlap,
                    'icon-ignore-placement': ignorePlacement,
                    'icon-optional': optional,
                    'icon-rotation-alignment': alignment,
                    'icon-size': 1,
                    'icon-text-fit': 'none',
                    'icon-text-fit-padding': [0,0,0,0],
                    'icon-image': null,
                    'icon-rotate': rotate,
                    'icon-padding': padding,
                    'icon-keep-upright': false,
                    'icon-offset': offset,
                    'icon-anchor': anchor,
                    'icon-pitch-alignment': alignment,
                    
                    'text-pitch-alignment': alignment,
                    'text-rotation-alignment': alignment,
                    'text-field': null,
                    'text-font': ["Open Sans Regular","Arial Unicode MS Regular"],
                    'text-size': 16,
                    'text-max-width': 10,
                    'text-line-height': 1.2,
                    'text-letter-spacing': 0,
                    'text-justify': 'auto', // auto, left, center, right,
                    'text-radial-offset': 0,
                    'text-variable-anchor': null,
                    'text-variable-anchor-offset': null,
                    'text-anchor': anchor,
                    'text-max-angle': 45,
                    'text-writing-mode': null,
                    'text-rotate': rotate,
                    'text-padding': padding,
                    'text-keep-upright': true,
                    'text-transform': 'none', // none, uppercase, lowercase
                    'text-offset': offset,
                    'text-allow-overlap': allowOverlap,
                    'text-overlap': overlap,
                    'text-ignore-placement': ignorePlacement,
                    'text-optional': optional,
                },
                paint: {
                    'icon-opacity': opacity,
                    'icon-color': fillColor,
                    'icon-halo-color': haloColor,
                    'icon-halo-width': width*3,
                    'icon-halo-blur': blur,
                    'icon-translate': translate,
                    'icon-translate-anchor': translateAnchor,

                    'text-opacity': opacity,
                    'text-color': fillColor,
                    'text-halo-color': haloColor,
                    'text-halo-width': width*3,
                    'text-halo-blur': blur,
                    'text-translate': translate,
                    'text-translate-anchor': translateAnchor,
                }
            },
            'misc': {
                shadowColor: 'black',
                shadowTranslate: [-2.5, 2.5],
                shadowOpacity: 0.5,
                labelField: ["get", "name"],
                labelSize: 12,
                labelVariableAnchor: ["top", "bottom", "left", "right"],
                labelRadialOffset: 0.5,
                labelJustify: 'auto',
                labelAllowOverlap: false,
            }
        }
    }

    filterGeoJSONFeatures(geojson, filters) {
        const {geometryFilters, propertyFilters, spatialFilters} = filters
        
        return geojson.features.filter(f => {
            if (!geometryFilters.find(i => f.geometry.type.endsWith(i))) return false
            if (propertyFilters.length) {
                if (!propertyFilters.every(({combinator, properties}) => {
                    return properties[combinator === 'any' ? 'some' : 'every'](({operator, property, values}) => {
                        const value = f.properties[property]
                        let isTrue = true

                        if (operator === '==') {
                            isTrue = value == values[0]
                        }

                        if (operator === '!=') {
                            isTrue = value != values[0]
                        }

                        if (operator === '>') {
                            isTrue = value > values[0]
                        }

                        if (operator === '>=') {
                            isTrue = value >= values[0]
                        }

                        if (operator === '<') {
                            isTrue = value < values[0]
                        }

                        if (operator === '<=') {
                            isTrue = value <= values[0]
                        }

                        if (operator === 'has') {
                            isTrue = !Array(null, undefined).includes(value)
                        }

                        if (operator === '!has') {
                            isTrue = Array(null, undefined).includes(value)
                        }

                        if (operator === 'in') {
                            isTrue = values.includes(value)
                        }

                        if (operator === '!in') {
                            isTrue = !values.includes(value)
                        }

                        return combinator === 'none' ? !isTrue : isTrue
                    })
                })) return false
            } 

            return true
        })
    }

    getVectorGroupParams({
        title='',
        color=utils.randomColor(),

        visibility='visible',
        minzoom=0,
        maxzoom=24,
        
        geometryFilters=Object.keys(this.getGeometryFilters()),
        propertyFilters=[],
        spatialFilters=[],
    }={}) {
        const typeParams = this.getDefaultVectorTypeParams({color})
        const misc = typeParams.misc

        const layers = Array(
            {
                name: 'layer background', 
                type: 'background',
                layout: {
                    visibility: 'none'
                },
            }, 
            {
                name: 'polygon shadow',
                type: 'fill',
                geometryFilters: ['Polygon'],
                layout: {
                    visibility: 'none'
                },
                paint: {
                    'fill-color': misc.shadowColor,
                    'fill-opacity': misc.shadowOpacity,
                    'fill-translate': misc.shadowTranslate,
                }
            },
            {
                name: 'polygon fill',
                type: 'fill',
                geometryFilters: ['Polygon'],
            },
            {
                name: 'polygon outline',
                type: 'line',
                geometryFilters: ['Polygon'],
                paint: {
                    'line-opacity': 1,
                    'line-color': typeParams.fill.paint['fill-color'],
                    'line-width': 2,
                }
            },
            {
                name: 'polygon 3D shadow',
                type: 'fill-extrusion',
                geometryFilters: ['Polygon'],
                layout: {
                    visibility: 'none'
                },
                paint: {
                    'fill-extrusion-color': misc.shadowColor,
                    'fill-extrusion-opacity': misc.shadowOpacity,
                    'fill-extrusion-translate': misc.shadowTranslate,
                }
            },
            {
                name: 'polygon 3D fill',
                type: 'fill-extrusion',
                geometryFilters: ['Polygon'],
                layout: {
                    visibility: 'none'
                },
            },
            {
                name: 'line shadow',
                type: 'line',
                geometryFilters: ['LineString'],
                layout: {
                    visibility: 'none'
                },
                paint: {
                    'line-opacity': misc.shadowOpacity,
                    'line-color': misc.shadowColor,
                    'line-translate': misc.shadowTranslate,
                }
            },
            {
                name: 'line',
                type: 'line',
                geometryFilters: ['LineString'],
            },
            {
                name: 'line symbol shadow',
                type: 'symbol',
                geometryFilters: ['LineString'],
                layout: {
                    visibility: 'none',
                    'symbol-placement': 'line',
                    'icon-offset': misc.shadowTranslate,
                },
                paint: {
                    'icon-color': misc.shadowColor,
                    'text-color': misc.shadowColor,
                }
            },
            {
                name: 'line symbol',
                type: 'symbol',
                geometryFilters: ['LineString'],
                layout: {
                    visibility: 'none',
                    'symbol-placement': 'line',
                }
            },
            {
                name: 'heatmap',
                type: 'heatmap',
                geometryFilters: ['Point'],
                layout: {
                    visibility: 'none',
                },
            },
            {
                name: 'point shadow',
                type: 'circle',
                geometryFilters: ['Point'],
                layout: {
                    visibility: 'none',
                },
                paint: {
                    "circle-color": misc.shadowColor,
                    "circle-opacity": misc.shadowOpacity,
                    "circle-translate": misc.shadowTranslate,
                }
            },
            {
                name: 'point',
                type: 'circle',
                geometryFilters: ['Point'],
            },
            {
                name: 'point symbol shadow',
                type: 'symbol',
                geometryFilters: ['Point'],
                layout: {
                    visibility: 'none',
                },
                paint: {
                    'icon-color': misc.shadowColor,
                    'text-color': misc.shadowColor,
                }
            },
            {
                name: 'point symbol',
                type: ['symbol'],
                geometryFilters: ['Point'],
                layout: {
                    visibility: 'none',
                },
            },
            {
                name: 'label',
                type: 'symbol',
                geometryFilters: ['Polygon', 'LineString', 'Point'],
                layout: {
                    visibility: 'none',
                    "text-field": misc.labelField,
                    "text-size": misc.labelSize,
                    "text-variable-anchor": misc.labelVariableAnchor,
                    "text-radial-offset": misc.labelRadialOffset,
                    "text-justify": misc.labelJustify,
                    "text-allow-overlap": misc.labelAllowOverlap,
                }
            },
        ).map(l => {
            const params = structuredClone(typeParams[l.type])
            
            Array('paint', 'layout').forEach(i => {
                params[i] = {
                    ...Object.fromEntries(
                        Object.entries(params[i])
                        .filter(([k,v]) => v !== null)
                    ), ...l[i]
                }
            })

            return {
                typeId: utils.randomId(),
                name: l.name,
                minzoom: l.minzoom ?? 0,
                maxzoom: l.maxzoom ?? 24,
                geometryFilters: l.geometryFilters ?? Object.keys(this.getGeometryFilters()),
                propertyFilters: l.propertyFilters ?? [],
                spatialFilters: l.spatialFilters ?? [],
                params,
            } // group layer definition
        })

        return {
            groupId: utils.randomId(),
            title,
            color,
            visibility,
            minzoom,
            maxzoom,
            geometryFilters,
            propertyFilters,
            spatialFilters,
            layers,
        } // group definition
    }

    updateLayerParams(id, params) {
        const map = this._map
        const layer = map.getStyle().layers.find(l => l.id === id)
        if (!layer) return

        Object.entries(params.layout ?? {}).forEach(([prop, val]) => {
            map.setLayoutProperty(id, prop, val)
        })

        Object.entries(params.paint ?? {}).forEach(([prop, val]) => {
            map.setPaintProperty(id, prop, val)
        })

        if (params.filter) {
            map.setFilter(id, params.filter)
        }

        if (params.minzoom || params.maxzoom) {
            map.setLayerZoomRange(
                id, 
                params.minzoom ?? layer.minzoom,
                params.maxzoom ?? layer.maxzoom
            )
        }

        Object.entries((params.metadata ??= {}).params ?? {}).forEach(([prop, val]) => {
            (layer.metadata.params ??= {})[prop] = val
        })

        return map.getLayer(layer)
    }

    async addLayerFromParams(params, {sourceId}={}) {
        const normalParams = this.normalizeLayerParams(structuredClone(params ?? {}))

        if (!sourceId) {
            sourceId = await utils.hashJSON(normalParams) 
        }

        const properties = {metadata: {params: normalParams}}

        if (Array('xyz', 'wms').includes(normalParams.type)) {
            this.addRasterLayer(sourceId, {properties})
        }
        
        if (Array('wfs').includes(params.type)) {
            this.addGeoJSONLayers(sourceId, {properties})
        }
    }

    addGeoJSONLayers(sourceId, {beforeId, properties={}}={}) {
        const map = this._map
        
        const source = (
            map.getSource(sourceId) 
            ?? this.getOrCreateSource(sourceId, {properties})
        )
        
        const metadata = properties.metadata ??= {}
        const name = metadata.name ??= utils.randomId()
        const layerName = metadata.layerName ??= `${sourceId}-${name}`
        beforeId = this.getBeforeId(layerName, beforeId)

        metadata.legendGroup ??= ['root']

        const params = metadata.params ??= {}
        const styles = params.styles ??= {default: [this.getVectorGroupParams()]}
        const styleName = params.style = params.style in styles ? params.style : Object.keys(styles)[0]
        const style = styles[styleName]

        const geomFilters = this.getGeometryFilters()
        const filterOperators = this.getFilterOperators()

        style.forEach(group => {
            const groupId = group.groupId
            if (group.visibility === 'none') return
            group.layers.forEach(layer => {
                const {type, paint, layout} = layer.params
                if (layout.visibility === 'none') return

                const typeId = layer.typeId
                const id = Array(layerName, groupId, type, typeId).join('-')

                const params = Array(metadata, group, layer)
                const geometryFilters = Object.entries(geomFilters).filter(([k,v]) => params.every(i => {
                    return (i.geometryFilters ??= Object.keys(geomFilters)).find(j => j === k)
                })).map(([k,v]) => v)
                const propertyFilters = params.filter(i => (i.propertyFilters ??= []).length).map(i => {
                    return ["all", ...(i.propertyFilters.filter(j => j.properties.length).map(j => {
                        return [j.combinator, ...(j.properties.filter(k => {
                            return filterOperators.includes(k.operator) && k.property
                        }).map(k => [k.operator, k.property, ...k.values]))]
                    }))]
                })
                const spatialFilters = []
                
                const layerParams = {
                    source: sourceId,
                    id,
                    type,
                    paint,
                    layout,
                    minzoom: Math.max(...params.map(i => i['minzoom'] ?? 0)),
                    maxzoom: Math.min(...params.map(i => i['maxzoom'] ?? 24)),
                    filter: [
                        "all",
                        ...(geometryFilters.length ? [["any", ...geometryFilters]] : []),
                        ...(propertyFilters.length ? [["all", ...propertyFilters]] : []),
                        ...(spatialFilters.length ? [["all", ...spatialFilters]] : []),
                    ],
                    metadata: {
                        ...source.metadata,
                        ...properties.metadata,
                        name,
                        layerName,
                        groupId,
                        typeId,
                        params: {
                            popups: {
                                tooltip: true,
                                info: true,
                            },
                            ...source.metadata?.params,
                            ...properties.metadata.params,
                        },
                    },
                }

                if (map.getLayer(id)) {
                    this.updateLayerParams(id, layerParams)
                } else {
                    map.addLayer(layerParams, beforeId)
                }
            })
        })

        return map.getStyle().layers.filter(l => l.id.startsWith(layerName))
    }

    addRasterLayer (sourceId, {properties={}}={}) {
        const map = this._map

        let source = map.getSource(sourceId)
        if (!source) {
            if (properties) {
                source = this.getOrCreateSource(sourceId, {properties})
            } else {
                return
            }
        }
        
        const metadata = properties.metadata ??= {}
        const params = metadata.params ??= {}
        const name = metadata.name ??= utils.randomId()
        const id = `${source.id}-${name}`

        map.addLayer({
            id,
            type: "raster",
            source: source.id,
            metadata: {
                ...source.metadata,
                ...metadata,
                params: {
                    ...source.metadata.params,
                    ...params,
                    info: {
                        active: Array('wms').includes(params.type) ? true : false,
                    },
                },
                layerName: id,
            },
        }, this.getBeforeId(id))   
        
        return map.getLayer(id)
    }

    removeSourceLayers(sourceId) {
        const map = this._map
        const source = map.getSource(sourceId)
        if (!source) return

        map.getStyle().layers?.forEach(l => {
            if (l.source !== sourceId) return
            map.removeLayer(l.id)
        })
    }

    getLayersByName(layerName) {
        return this._map.getStyle().layers.filter(l => l.id.startsWith(layerName))
    }

    getOrCreateSource(id, {properties}={}) {
        let source = this._map.getSource(id)
        
        if (!source) {
            const type = properties?.metadata?.params?.type
            
            if (type === 'xyz') {
                source = this.createXYZSource(id, {properties})
            } else if (type === 'wms') {
                source = this.createWMSSource(id, {properties})
            } else {
                source = this.createGeoJSONSource(id, {properties})
            }
        }

        if (source && properties) {
            Object.entries(properties).forEach(([k,v]) => source[k] = v)
        }

        return source
    }

    createXYZSource(id, {properties}={}) {
        const map = this._map
  
        const {url, get} = properties?.metadata?.params
        if (!url) return

        map.addSource(id, {
            type: "raster",
            tileSize: 256,
            tiles: [utils.pushURLParams(url, get ?? {})],
        })

        return map.getSource(id)
    }

    createWMSSource(id, {properties}={}) {
        const map = this._map

        const {url, name, style, get} = properties?.metadata?.params 
        if (!url || !name || !style) return

        map.addSource(id, {
            type: "raster",
            tileSize: 256,
            tiles: [pushURLParams(url, {
                ...get ?? {},
                SERVICE: 'WMS',
                VERSION: '1.1.1',
                REQUEST: 'GetMap',
                LAYERS: name,
                BBOX: "{bbox-epsg-3857}",
                WIDTH: 256,
                HEIGHT: 256,
                SRS: "EPSG:3857",
                FORMAT: "image/png",
                TRANSPARENT: true,
                STYLES: style,
            })],
        })

        return map.getSource(id)
    }

    createGeoJSONSource(id, {properties={}}={}) {
        const map = this._map
        map.addSource(id, {type: "geojson", data: turf.featureCollection([])})
        return map.getSource(id)
    }

    normalizeLayerParams(params) {
        if (!params.type) {
            params.type = params.format
        }
        
        if (!params.bbox) {
            params.bbox = [-180, -90, 180, 90]
        }
        
        if (!params.crs) {
            params.crs = 'EPSG:4326'
        }
        
        if (!params.title) {
            params.title = params.name
        }

        if (params.styles) {
            if (!params.style || !(params.style in params.styles)) {
                params.style = Object.keys(params.styles)[0]
            }
        }

        if (!params.attribution && params.url) {
            const domain = utils.getURLDomain(params.url)
            params.attribution = `<span class='text-gray-600/100! font-thin'>Data from <a class='' href="https://www.${domain}/" target="_blank">${domain}</a></span>`
        }

        if (params.type === 'wfs') {
            params.get = Object.fromEntries(
                Object.entries(params.get ?? {})
                .map(([k,v]) => [k.toLowerCase(), v])
            )
        }

        if (params.type === 'wms') {
            params.get = Object.fromEntries(
                Object.entries(params.get ?? {})
                .map(([k,v]) => [k.toUpperCase(), v])
            )
        }
        
        return params
    }

    async getCanvasData({
        bbox, point,
        layers, filter,
        rasters=false,
        signal,
    }={}) {
        const map = this._map
        const canvas = map.getCanvas()

        if (!point && !bbox) {
            bbox = [[0,0], [canvas.width, canvas.height]]
        }

        let features = map.queryRenderedFeatures(bbox ?? point, {layers, filter})

        if (rasters && point) {
            const sources = new Set(map.getStyle().layers.map(l => {
                if (layers?.length && !layers.includes(l.id)) return

                const source = map.getSource(l.source)
                if (Array('vector', 'geojson').includes(source?.type)) return
                if (Array('xyz').includes(source?.metadata?.params.type)) return
                
                return source
            }).filter(Boolean))

            const lngLat = map.unproject(point)
            const feature = turf.point(Object.values(lngLat))

            for (const source of sources) {
                const metadata = source.metadata
                const params = metadata?.params

                if (params?.bbox && !turf.booleanPointInPolygon(
                    feature, turf.bboxPolygon(params.bbox)
                )) continue

                let data

                if (Array('wms').includes(params?.type)) {
                    console.log('use signal for wms fetch')
                    try {
                        data = await fetchWMSData(params, {map, point})
                    } catch (error) {
                        console.log(error)
                    }
                }
                                
                if (data?.features?.length) {
                    features = [
                        ...features,
                        ...data.features.map(f => {
                            f.layer = {source: source.id}
                            return f
                        })
                    ]
                }
            }
        }

        const uniqueFeatures = []

        features.forEach(f1 => {
            if (uniqueFeatures.find(f2 => f1.source === f2.source && gisUtils.featuresAreSimilar(f1, f2))) return
            uniqueFeatures.push(f1)
        })

        return uniqueFeatures
    }

    getRawFeature(feature) {
        let rawFeature = feature
        
        const id = gisUtils.getFeatureId(feature)
        const source = this._map.getStyle().sources[feature.source]
        
        if (id && source) {
            rawFeature = source.data.features.find(i => gisUtils.getFeatureId(i) === id)
        }

        return rawFeature ?? feature
    }

    highlightedLayerProperties() {
        const groupParams = this.getVectorGroupParams({
            color: `hsl(180, 100%, 50%)`
        })

        groupParams.layers.find(l => l.name === "polygon fill").params.paint['fill-opacity'] = 0
        groupParams.layers.find(l => l.name === "polygon outline").params.paint['line-width'] = 3

        return {
            metadata: {
                name: 'default',
                params: {
                    style: 'default',
                    styles: {
                        default: [groupParams]
                    }
                }
            }
        }
    }

    updateGeoJSONData({
        sourceId, 
        features=[], 
        action='overwrite', // add, remove
    }={}) {
        const map = this._map
        const source = map.getSource(sourceId)
        if (!source || source.type !== 'geojson') return

        let newData
        if (action === 'overwrite') {
            newData = turf.featureCollection(features)
        } else {
            let currentData = source._data?.geojson ?? {}
            if (currentData.type === 'Feature') {
                currentData = turf.featureCollection([currentData])
            } else {
                currentData.features ??= []
            }

            if (action === 'add') {
                newData = turf.featureCollection([...currentData.features, ...features])
            } else if (action === 'remove') {
                const removeIds = features.map(f => gisUtils.getFeatureId(f))
                newData = turf.featureCollection(currentData.features.filter(f => !removeIds.includes(gisUtils.getFeatureId(f))))
            }
        }

        source.setData(newData)
        map.fire('geojsonupdated', {sourceId, source, action, newData, features})
    }

    findFeatureById(sourceId, featureId) {
        const map = this._map
        const source = map.getSource(sourceId)
        if (source?.type !== 'geojson') return
        
        const features = source._data?.geojson?.features
        if (!features?.length) return

        return features.find(f => gisUtils.getFeatureId(f) === featureId)
    }

    configFeatureMenu({parent, feature, sourceId}={}) {
        const map = this._map
        const source = map.getSource(sourceId ?? feature.source ?? feature.layer?.source)

        const featureId = gisUtils.getFeatureId(feature)
        const rawFeature = this.getRawFeature(feature)

        const [toggle, menu] = dropdown({
            parent,
            title: 'Feature menu',
            menuClassList: ['right-1']
        }).children

        const featureLabel = (
            gisUtils.getFeatureLabel(feature) 
            || feature.layer?.metadata?.params?.title 
            || feature.geometry?.type 
        )

        const btns = Array(
            {
                title: 'Interactions',
                options: [
                    ...(source && sourceId === 'info' ? [
                        {
                            innerText: '',
                            attrs: {
                                'x-data': `{visible: ${
                                    this.findFeatureById(
                                        sourceId, 
                                        featureId
                                    ) ? true : false
                                }}`,
                                'x-text': `visible ? "Hide feature" : "Show feature"`
                            },
                            events: {
                                'click': (e) => {
                                    this.updateGeoJSONData({
                                        sourceId,
                                        features: [rawFeature],
                                        action: !Alpine.$data(e.target).visible ? 'add' : 'remove',
                                    })
                                }
                            },
                            init: (btn) => {
                                map.on('geojsonupdated', (e) => {
                                    if (e.sourceId !== sourceId) return
                                    Alpine.$data(btn).visible = (
                                        this.findFeatureById(
                                            sourceId, 
                                            featureId
                                        ) ? true : false
                                    )
                                })
                            }
                        }
                    ] : []),
                    {
                        innerText: 'Zoom to feature',
                        attrs: {
                            'x-bind:disabled': 'locked',
                        },
                        events: {
                            'click': () => this.zoomToFeature(rawFeature)
                        }
                    },
                ],
            },
            {
                title: 'GeoJSON options',
                options: [
                    {
                        innerText: 'View feature',
                        events: {
                            'click': (e) => {
                                const blob = new Blob([JSON.stringify(rawFeature, null, 2)], { type: "application/json" })
                                const url = URL.createObjectURL(blob)
                                window.open(url, "_blank")
                            }
                        }
                    },
                    {
                        innerText: 'Copy feature',
                        events: {
                            'click': () => {
                                navigator.clipboard.writeText(JSON.stringify(rawFeature))
                            }
                        }
                    },
                ]
            },
            {
                title: 'Export options',
                options: [
                    {
                        innerText: 'Download GeoJSON',
                        events: {
                            'click': () => {
                                const blob = new Blob(
                                    [JSON.stringify(turf.featureCollection([rawFeature]))], 
                                    {type: "application/json"}
                                )
                                const url = URL.createObjectURL(blob)
                                const a = document.createElement("a")
                                a.href = url
                                a.download = featureLabel
                                document.body.appendChild(a)
                                a.click()
                                document.body.removeChild(a)
                                URL.revokeObjectURL(url)
                            }
                        }
                    },
                    ...(!map.isStaticConfig() ? [
                        {
                            innerText: 'Add to layer',
                            init: (btn) => {
                                btn.addEventListener('click', (e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                })

                                const [toggle, menu] = dropdown({
                                    parent: btn,
                                    title: 'GeoJSON layers',
                                    menuClassList: ['right-1']
                                }).children

                                toggle.addEventListener('click', (e) => {
                                    const collapsed = Alpine.$data(toggle.parentElement).showDropdown
                                    if (collapsed) return

                                    menu.innerHTML = ''

                                    const layers = []
                                    map.getStyle().layers.forEach(l => {
                                        if (this.getAllSystemLayerNames().find(i => i === l.source)) return
                                        
                                        const source = map.getSource(l.source)
                                        if (source?.type !== 'geojson') return

                                        if (layers.find(i => i.metadata.layerName === l.metadata.layerName)) return

                                        layers.push(l)
                                    })

                                    const newBtn = document.createElement('button')
                                    newBtn.innerText = 'Create new layer'
                                    newBtn.addEventListener('click', async (e) => {
                                        const newSource = this.getOrCreateSource(utils.randomId(), {
                                            properties: {metadata: {params: {
                                                title: featureLabel || 'Untitled layer'
                                            }}}
                                        })
                                        this.updateGeoJSONData({
                                            sourceId: newSource.id,
                                            features: [await gisUtils.normalizeProperties(rawFeature)],
                                        })
                                        this.addGeoJSONLayers(newSource.id)
                                    })
                                    menu.appendChild(newBtn)                              
                                    
                                    layers.filter(Boolean).reverse().forEach(l => {
                                        const layerBtn = document.createElement('button')
                                        layerBtn.innerText = l.metadata.params.title
                                        layerBtn.addEventListener('click', async (e) => {
                                            this.updateGeoJSONData({
                                                sourceId: l.source,
                                                features: [await gisUtils.normalizeProperties(rawFeature)],
                                                action: 'add',
                                            })
                                        })
                                        menu.appendChild(layerBtn)                              
                                    })
                                })
                            }
                        },
                    ] : []),
                ],
            }
        )
        
        btns.forEach((group, index) => {
            // const groupHeader = document.createElement('span')
            // groupHeader.innerText = group.title
            // menu.appendChild(groupHeader)

            group.options.forEach(params => {
                const btn = document.createElement('button')
                btn.classList.add('flex', 'flex-nowrap', 'justify-between', 'gap-5')
                menu.appendChild(btn)

                Object.entries(params.attrs ?? {}).forEach(([key, value]) => {
                    btn.setAttribute(key, value)
                })
                
                Object.entries(params.events ?? {}).forEach(([key, value]) => {
                    btn.addEventListener(key, value)
                })
                
                if (params.innerText) {
                    const label = document.createElement('span')
                    label.innerText = params.innerText
                    btn.appendChild(label)
                }

                params.init?.(btn)
            })

            if (index === btns.length-1) return

            const hr = document.createElement('hr')
            menu.appendChild(hr)
        })
    }

    createPropertiesTable({
        feature,
        parent,
        sourceId,
        show = true,
    }={}) {
        const label = [...new Set([
            feature.layer?.metadata?.params?.title,
            gisUtils.getFeatureLabel(feature) || feature.geometry?.type 
        ].filter(Boolean))].join(' - ')

        const container = document.createElement('div')
        container.setAttribute('x-data', `{show:${show}}`)
        container.classList.add('flex', 'flex-col')
        parent.appendChild(container)

        const header = document.createElement('div')
        header.classList.add('flex', 'flex-nowrap', 'justify-between',  'gap-2')
        container.appendChild(header)
        
        const icon = document.createElement('span')
        icon.classList.add('self-center')
        icon.innerText = '📚'
        header.appendChild(icon)
        
        const titleEl = document.createElement('span')
        titleEl.classList.add('self-center', 'grow')
        titleEl.innerText = label
        header.appendChild(titleEl)
        
        const btns = document.createElement('div')
        btns.classList.add('flex', 'flex-nowrap', 'gap-1')
        header.appendChild(btns)

        const collapseBtn = utils.strToEl(button({
            title: 'Toggle properties table',
            icon: svg.chevronUpMini,
            attrs: `@click="show = !show" x-html="show ? svg.chevronUpMini : svg.chevronDownMini"`,
            classStr: 'p-0! w-[15px]! h-[15px]! opacity-25! hover:opacity-100! grow!',
        }))
        btns.appendChild(collapseBtn)

        this.configFeatureMenu({
            parent: btns,
            feature,
            sourceId,
        })

        const tableContainer = document.createElement('div')
        tableContainer.classList.add('overflow-auto', 'max-h-[25vh]')
        container.appendChild(tableContainer)

        const tableEl = document.createElement('table')
        tableEl.setAttribute('x-show', 'show')
        tableEl.classList.add(
            'table-auto',
            'w-full', 
            'h-[25vh]',
        )
        tableContainer.appendChild(tableEl)

        const tbody = document.createElement('tbody')
        tableEl.appendChild(tbody)
        
        const properties = Object.entries(feature.properties).filter(i => i[0] !== '__ms__')
        properties.forEach(([key, value], index) => {
            const tRow = document.createElement('tr')
            tRow.classList.add('rounded', ...(index%2===0 ? ['bg-gray-200/50!','dark:bg-gray-950/50!'] : []))
            utils.appendBinding(tRow, `:class`, `['border-t border-'+color+'-600/25!']: true`)
            tbody.appendChild(tRow)

            const keyTd = document.createElement('td')
            keyTd.classList.add('p-2')
            keyTd.innerText = key
            tRow.appendChild(keyTd)

            const valueTd = document.createElement('td')
            valueTd.classList.add('p-2', 'break-normal')
            valueTd.innerText = value
            tRow.appendChild(valueTd)
        })

        return container
    }

    zoomToFeature(feature) {
        const map = this._map
        if (map.getTheme().settings.locked) return

        const [w,s,e,n] = feature.bbox ?? turf.bbox(feature)
        map.fitBounds([[w,s],[e,n]], {
            padding: 100,
            maxZoom: Math.max(13, map.getZoom())
        })
    }
}