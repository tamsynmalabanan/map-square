export const removeWhitespace = (str) => {
    return str.replace(/\s{2,}/g, ' ').trim();
}
export const strToEl = (str) => {
    const div = document.createElement('div');
    div.innerHTML = removeWhitespace(str);
    return div.firstElementChild;
}

export const objToStr = (obj) => {
    return JSON.stringify(obj).replace(/"/g, '&quot;')
}

export const randomId = (prefix=undefined, suffix=undefined) => {
    return Array(
        prefix, 
        Math.random().toString(36).substr(2, 9), 
        suffix
    ).filter(Boolean).join('-')
}

export const appendBinding = (el, attr, exp) => {
    const existingBinding = el.getAttribute(attr)
    const cleanExp = removeWhitespace(existingBinding ? existingBinding.replace('}', `, ${exp}}`): `{${exp}}`)
    el.setAttribute(attr, cleanExp)
}