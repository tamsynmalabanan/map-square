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

export const pushURLParams = (url, params) => {
    const urlObj = new URL(url)
    
    Object.entries(params).forEach(([k,v]) => {
        urlObj.searchParams.set(k, v)
    })

    return decodeURIComponent(urlObj.toString())
}

export const customFetchMap = new Map()

export const customFetch = async (url, {
    params = {},
    timeout = 60000,
    abortController = new AbortController(),
    abortEvents = [],
    callback = (response) => response,
} = {}) => {
    params.headers ??= {}
    params.headers['User-Agent'] ??= 'Map Square/1.0 (admin@mapsquare.com)'

    const cleanUrl = url.replaceAll('http:', 'https:')
    const id = params.id ?? await utils.hashJSON({cleanUrl, params})
    
    if (customFetchMap.has(id)) {
        const response = (await customFetchMap.get(id)).clone()
        return callback(response)
    }
    
    const abortFetch = () => abortController.abort('Ran fetch timeout.')
    const timer = setTimeout(abortFetch, timeout)
    abortEvents.forEach(([element, types]) => {
        types.forEach(type => {
            element.addEventListener(type, abortFetch)
        })
    })

    const fetchPromise = fetch(cleanUrl, {
        ...params, 
        signal: abortController.signal,
        cache: 'no-store',
    }).then(async response => {
        if (!response.ok) {
            throw new Error(`Fetch failed: ${response.status} ${response.statusText}`)
        }
        return response
    }).catch(error => {
        throw error
    }).finally(() => {
        clearTimeout(timer)
   
        abortEvents.forEach(([element, types]) => {
            types.forEach(type => {
                element.removeEventListener(type, abortFetch)
            })
        })
   
        setTimeout(() => customFetchMap.delete(id), 2000)
    })

    customFetchMap.set(id, fetchPromise)
    const response = (await fetchPromise).clone()
    return callback(response)
}

export const parseJSONResponseMap = new Map()

export const parseJSONResponse = async (response, {
    id, timeout = 60000,
} = {}) => {
    if (id && parseJSONResponseMap.has(id)) {
        return parseJSONResponseMap.get(id)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder('utf-8')
    let result = ''
  
    const timeoutPromise = new Promise((resolve, reject) => {
        setTimeout(() => {
            reject(new Error('Parsing timed out.'))
        }, timeout)
    })
  
    const parsePromise = (async () => {
        try {
            while (true) {
                const { done, value } = await Promise.race([reader.read(), timeoutPromise])
                if (done) break
                result += decoder.decode(value, { stream: true })
            }
            return JSON.parse(result)
        } catch (error) {
            if (error.name === 'AbortError') {
                return
            } else {
                throw error
            }
        } finally {
            reader.releaseLock()
            if (id) {
                setTimeout(() => parseJSONResponseMap.delete(id), 2000)
            }
        }
    })()

    if (id) {
        parseJSONResponseMap.set(id, parsePromise)
    }

    return parsePromise
}

export const parseXML = (xmlString) => {
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml')
    const rootElement = xmlDoc.documentElement
    
    let namespace
    const namespaces = rootElement.attributes;
    for (let i = 0; i < namespaces.length; i++) {
        const name = namespaces.item(i).name
        if (name.startsWith('xmlns')) {
            namespace = namespaces.item(i).value
        }
    }

    return [namespace, rootElement]
}