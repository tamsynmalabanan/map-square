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

export const observeElement = (el, callback = () => {}, timeout = 100) => {
    let timer

    const observer = new MutationObserver(mutations => {
        clearTimeout(timer)
        timer = setTimeout(() => {
            callback(mutations, el)
        }, timeout)
    })

    observer.observe(el, { childList: true, subtree: true, characterData: true, attributes: true })
    
    return observer
}

export const sortObjectKeys = (obj) => {
    if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
        return Object.keys(obj).sort().reduce((acc, key) => {
            acc[key] = sortObjectKeys(obj[key])
            return acc
        }, {})
    } else if (Array.isArray(obj)) {
        return obj.map(sortObjectKeys)
    }

    return obj
}

export const canonicalize = (obj) => {
    return JSON.stringify(sortObjectKeys(obj))
}

export const hashJSON = async (obj) => {
    const jsonStr = canonicalize(obj)
    const encoder = new TextEncoder()
    const data = encoder.encode(jsonStr)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}