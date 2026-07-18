export const searchNominatimOSM = async (place) => {
    if (typeof place != 'string') return
    if (place.length < 3) return    
    place = utils.removeWhitespace(place).toLowerCase()

    const url = 'https://nominatim.openstreetmap.org/search'
    const getParams = {q, format: 'geojson', limit: params.limit ?? 1000}

    const id = await hashJSON({url, ...getParams})
    const geojson = (await getGISDBData(id))?.data
    
    if (geojson?.features?.length) {
        return geojson
    }

    return await customFetch(pushURLParams(url, getParams), {
        id,
        abortController,
        abortEvents,
        callback: async (response) => {
            const data = await parseJSONResponse(response, {id})
            if (data?.features?.length) {
                await normalizeGeoJSON(data)
                updateGISDBData(id, {data})
            }
            return data
        }
    }).catch(error => {})
}