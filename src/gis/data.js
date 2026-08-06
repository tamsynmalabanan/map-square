import { saveToGISDB } from "./db"

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
            saveToGISDB('data', {id, data, group: 'Searched Places', name: place})
        }
        return data
    }}).catch(error => {})
}