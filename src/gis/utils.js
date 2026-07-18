import * as turf from '@turf/turf'
import _ from 'lodash';
import proj4 from 'proj4'

export const isLngLatString = (value) => {
    const coords = value.replaceAll(',', ' ').split(' ').map(i => parseFloat(i)).filter(i => !isNaN(i))
    if (coords.length != 2) return false

    const {lng, lat} = coords
    if (lng > 180 || lng < -180) return false
    if (lat > 90 || lat < -90) return false

    return coords
}

export const normalizeBbox = (bbox) => {
    if (!Array.isArray(bbox) || bbox.length < 4) {
        throw new Error("bbox must be an array of [west, south, east, north]")
    }

    let [w, s, e, n] = bbox

    w = Math.max(-180, Math.min(180, w));
    e = Math.max(-180, Math.min(180, e));

    s = Math.max(-90, Math.min(90, s));
    n = Math.max(-90, Math.min(90, n));

    return [w, s, e, n]
}

export const bboxToGeoJSON = (bbox) => {
    const normalBbox = normalizeBbox(bbox)
    const [w,s,e,n] = normalBbox
    
    return turf.featureCollection([
        turf.bboxPolygon(normalBbox), 
        ...Object.keys(bbox).map(i => {
            const index = parseInt(i)
            const diff = bbox[index] - normalBbox[index]
            if (diff == 0) return
            if (index == 0) return turf.bboxPolygon([180+diff, s, 180, n])
            if (index == 2) return turf.bboxPolygon([-180, s, -180+diff, n])
        }).filter(Boolean)
    ])
}

export const featuresAreSimilar = (f1, f2) => {
    if (f1.geometry.type !== f2.geometry.type) return false
    
    try {
        if (!turf.booleanIntersects(f1, f2)) return false
    } catch {}

    try {
        if (!turf.booleanEqual(f1.geometry, f2.geometry)) return false
    } catch {}
    
    if (!_.isEqual(f1.properties, f2.properties)) return false
    return true
}

export const normalizeGeoJSON = async (geojson) => {
    if (!geojson?.features?.length) return
    
    geojson.features = geojson.features.filter(f => f.geometry)

    if (geojson.crs) {
        const srid = parseInt(
            geojson.crs?.properties?.name
            ?.toLowerCase().replace('::', ':')
            ?.split('epsg:', 2)?.pop()
        )
        
        if (!isNaN(srid)) {
            delete geojson.crs
            if (srid !== 4326) {
                geojson = await transformCoordinates(geojson, srid, 4326)
            }   
        }
    }

    for (const f of geojson.features) {
        delete f.properties.__ms__

        f.properties = normalizeProperties(f)

        f.properties.__ms__ = {
            id: await utils.hashJSON(turf.feature(f.geometry, f.properties))
        }
    }
}

export const normalizeProperties = (feature) => {
    const properties = feature.properties ??= {}
    const normalProperties = {}

    const handler = (properties, prefix='') => {
        prefix = prefix.trim()

        Object.entries(properties).forEach(([property, value]) => {
            const name = prefix ? `${prefix}_${property}` : property
            
            if (Array.isArray(value) && !value.find(i => typeof i === 'object')) {
                normalProperties[name] = value.map(i => String(i)).join(', ')
            } else if (value && typeof value === 'object') {
                handler(value, prefix=name)
            } else {
                normalProperties[name] = value
            }
        })
    }

    handler(properties)    

    return normalProperties
}

export const transformCoordinates = async (geojson, source, target) => {
    const {sourceCrs, targetCrs} = Array(source, target).map(async i => {
        const crs = `EPSG:${i}`
        if (!proj4.defs(crs)) {
            await fetchProj4Def(i)
        }
        return crs
    })

    if (proj4.defs(sourceCrs) && proj4.defs(targetCrs)) {
        turf.coordEach(geojson, (currentCoord) => {
            const transformed = proj4(sourceCrs, targetCrs, currentCoord.slice(0,3))
            currentCoord[0] = transformed[0]
            currentCoord[1] = transformed[1]
            if (transformed.length > 2) {
                currentCoord[2] = transformed[2]
            }
        })
    }

    return geojson
}

export const fetchProj4Def = async (srid) => {
    return await utils.customFetch(`https://spatialreference.org/ref/epsg/${srid}/ogcwkt`, {
        callback: async (response) => {
            const def = await response.text()
            const crs = `EPSG:${srid}`
            proj4.defs(crs, def)
            return proj4.defs(crs)
        },
    }).catch(error => {
        console.error(error)
    })
}