import { LngLat } from "maplibre-gl"
import { saveToGISDB } from "./db"
import { parseJSONResponse } from "../utils"

export const searchNominatimOSM = async (place, {signal}={}) => {
    if (typeof place != 'string') return

    place = utils.removeWhitespace(place).toLowerCase()
    if (place.length < 3) return

    const url = utils.pushURLParams('https://nominatim.openstreetmap.org/search', {
        q: place, format: 'geojson', limit: 1000
    })

    const id = await utils.hashJSON({url})
    const data = (await gisDB.getFromGISDB('data', id))?.data
    
    if (data?.features?.length) {
        return data
    }

    return await utils.customFetch(url, {id, signal, callback: async (response) => {
        const data = await utils.parseJSONResponse(response, {id})
        if (data?.features?.length) {
            await gisUtils.normalizeGeoJSON(data)
            saveToGISDB('data', {id, data, group: 'place_search', name: place})
        }
        return data
    }}).catch(error => {})
}

export const reverseSearchNominatimOSM = async (lngLat, {
    signal, zoom,
} = {}) => {
    const {lng, lat} = lngLat
    if (isNaN(lng) || isNaN(lat)) return
    
    zoom = Math.round(!zoom || zoom > 18 ? 18 : zoom)

    const url = utils.pushURLParams('https://nominatim.openstreetmap.org/reverse?', {
        lat, lon:lng, zoom,
        format: 'geojson',
        polygon_geojson: 1,
        polygon_threshold: 0,
    })

    return await utils.customFetch(url, {
        signal, callback: async (response) => {
            const data = await utils.parseJSONResponse(response)
            return await gisUtils.normalizeGeoJSON(data)
        }
    }).catch(error => {})
}

export const getElevation = async (lngLat, {signal}={}) => {
    const {lng, lat} = lngLat
    const sources = [
        {
            name: 'Open Topo Data',
            url: `https://api.opentopodata.org/v1/srtm30m?locations=${lat},${lng}`,
            handler: (data) => {
                return data?.results?.elevation
            },
        },
        {
            name: 'OpenZenith',
            url: `https://openzenith.cyopsys.com/api/elevation?lat=${lat}&lon=${lng}`,
            handler: (data) => {
                return data?.elevation
            },
        },
        {
            name: 'Open-Elevation',
            url: `https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lng}`,
            handler: (data) => {
                return data?.results?.elevation
            },
        },
    ]

    let sourceName
    let elevation

    for (const source of sources) {
        elevation = await utils.customFetch(source.url, {signal, callback: async (response) => {
            const data = await utils.parseJSONResponse(response)
            return source.handler(data)
        }}).catch(error => {})
        
        if (isNaN(elevation)) continue

        sourceName = source.name
        break
    }

    return {elevation, sourceName}
}