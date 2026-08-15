import { indexOf } from "lodash"
import button from "../../templates/button.js"

export class LegendControl {
    constructor(options) {
    }

    onAdd(map) {
        this._map = map
        
        const container = this._container = document.createElement('div')
        container.classList.add('maplibregl-ctrl','maplibregl-ctrl-group')
        container.setAttribute('x-data', 'collapseGroup')

        container.innerHTML = button({
            title: 'Legend',
            icon: svg.square3Stack3dMini,
            classStr: 'maplibregl-ctrl-legend',
            attrs: `@click='toggleCollapse' x-show='collapsed'`
        })

        const content = document.createElement('div')
        content.classList.add('flex', 'flex-col')
        content.setAttribute('x-show', '!collapsed')
        container.appendChild(content)
        
        const nav = document.createElement('div')
        nav.classList.add('grid', 'justify-items-stretch')
        content.appendChild(nav)

        nav.appendChild(utils.strToEl(button({
            title: 'Collapse legend',
            icon: svg.xMini,
            classStr: 'maplibregl-ctrl-close justify-self-end',
            attrs: `@click='toggleCollapse' x-show='!collapsed'`
        })))

        const layers = document.createElement('div')
        layers.innerHTML = 'legend'
        content.appendChild(layers)

        return container
    }
    
    onRemove() {
        this._container.parentNode.removeChild(this._container);
        this._map = undefined;
    }

    getSystemOverlayNames() {
        return [
            'placeSearch',
            'infoFeature', 
            'tooltipFeature', 
        ]
    }

    getBaseLayerNames() {
        return [
            'basemap',
            'mask',
            'hillshade', 
        ]
    }

    getGeometryFilters() {
        return Object.fromEntries(Array(
            'Polygon', 'LineString', 'Point'
        ).map(i => [i, ["==", "$type", i]]))
    }

    getFilterOperators() {
        return ["==", "!=", ">", ">=", "<", "<=", 'has', '!has', 'in', '!in']
    }

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

    getVectorTypeParams({color=utils.randomColor()}={}) {
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
                    'background-color': Alpine.store('displaySettings').darkMode ? 'black' : 'white',
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
        const typeParams = this.getVectorTypeParams({color})
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

    addGeoJSONLayers(sourceId, {beforeId, properties={}}={}) {
        const map = this._map
        const source = map.getSource(sourceId)
        if (!source) return
        
        const metadata = properties.metadata ??= {}
        const name = metadata.name ??= utils.randomId()
        const layerName = metadata.layerName ??= `${sourceId}-${name}`
        beforeId = this.getBeforeId(layerName, beforeId)

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
                            tooltip: {
                                active: true,
                            },
                            popup: {
                                active: true,
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

    removeSourceLayers(sourceId) {
        const map = this._map
        const source = map.getSource(sourceId)
        if (!source) return

        map.getStyle().layers?.forEach(l => {
            if (l.source !== sourceId) return
            map.removeLayer(l.id)
        })
    }
}