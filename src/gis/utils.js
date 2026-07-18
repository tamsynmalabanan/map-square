import * as turf from '@turf/turf'

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