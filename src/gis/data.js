import { saveToGISDB } from "./db"

export const searchNominatimOSM = async (place, {
    abortController, abortEvents,
}={}) => {
    if (typeof place != 'string') return
    if (place.length < 3) return

    const q = utils.removeWhitespace(place).toLowerCase()
    const url = utils.pushURLParams('https://nominatim.openstreetmap.org/search', {
        q, format: 'geojson', limit: 1000
    })

    const id = await utils.hashJSON({url})
    const data = (await gisDB.getFromGISDB('data', id))?.data
    
    if (data?.features?.length) {
        return data
    }

    return await utils.customFetch(url, {
        id,
        abortController,
        abortEvents,
        callback: async (response) => {
            const data = await utils.parseJSONResponse(response, {id})
            if (data?.features?.length) {
                await gisUtils.normalizeGeoJSON(data)
                saveToGISDB('data', {id, data, type: 'place search', name: `Place search for "${q}"`})
            }
            return data
        }
    }).catch(error => {})
}