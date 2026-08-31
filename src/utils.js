export const removeWhitespace = (str) => {
    return str.replace(/\s{2,}/g, ' ').trim();
}
export const strToEl = (str) => {
    const div = document.createElement('div');
    div.innerHTML = removeWhitespace(str);
    return div.firstElementChild;
}

export const toTitleCase = (str) => {
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
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

export const randomColor = () => {
    return `hsla(${Math.floor(Math.random() * 361)}, 100%, 50%, 1)`
}

export const parseNumber = (string) => {
    const regex = /\d+(\.\d+)?/;
    const match = string.match(regex);
    return match?.length ? parseFloat(match[0]) : null
}

export const hslaColor = (color='hsla(0, 0%, 100%, 1)') => {
    if (typeof color !== 'string' || !color.startsWith('hsl')) return
    
    const [h,s,l,a] = color.split(',').map(str => parseNumber(str))
    
    const obj = {
        h: h || 1,
        s,
        l,
        a: a ?? 1,
    }

    obj.toString = ({
        h=obj.h,
        s=obj.s,
        l=obj.l,
        a=obj.a,
    }={}) => {
        return `hsla(${h}, ${s}%, ${l}%, ${a})`
    }
    
    return obj
}

export const hslToHex = ({h=0, s=100, l=50}={}) => {
    l /= 100
    const a = s * Math.min(l, 1 - l) / 100
    const f = n => {
      const k = (n + h / 30) % 12
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
      return Math.round(255 * color).toString(16).padStart(2, '0')
    }
    return `#${f(0)}${f(8)}${f(4)}`
}

export const hexToRGB = (hex) => {
    hex = hex.replace(/^#/, '');
    if (hex.length === 3) {
      hex = hex.split('').map(c => c + c).join('')
    }
    const bigint = parseInt(hex, 16)
    const r = (bigint >> 16) & 255
    const g = (bigint >> 8) & 255
    const b = bigint & 255

    return `rgb(${r}, ${g}, ${b})`
}

export const rgbToHSLA = (rgb) => {
    rgb = rgb.split('(')[rgb.split('(').length-1].split(',')
    
    let r = parseInt(rgb[0]) / 255
    let g = parseInt(rgb[1]) / 255
    let b = parseInt(rgb[2]) / 255
  
    let max = Math.max(r, g, b)
    let min = Math.min(r, g, b)
    let delta = max - min
  
    let l = (max + min) / 2;
  
    let s = 0
    if (delta !== 0) {
      s = l < 0.5 ? delta / (max + min) : delta / (2 - max - min);
    }
  
    let h = 0
    if (delta !== 0) {
      if (max === r) {
        h = (g - b) / delta
      } else if (max === g) {
        h = 2 + (b - r) / delta
      } else if (max === b) {
        h = 4 + (r - g) / delta
      }
    }
    h = Math.round(h * 60)
    if (h < 0) {
      h += 360
    }
  
    s = +(s * 100).toFixed(1)
    l = +(l * 100).toFixed(1)
  
    return `hsla(${h}, ${s}%, ${l}%, 1)`
}

export const hexToHSLA = (hex) => {
    return rgbToHSLA(hexToRGB(hex))
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

export const activeFetches = new Map()

export const customFetch = async (url, {
    params = {},
    signal,
    callback,
} = {}) => {
    params.headers ??= {}
    params.headers['User-Agent'] ??= 'Map Square/1.0 (admin@mapsquare.com)'

    const cleanUrl = url.replaceAll('http:', 'https:')
    const id = params.id ?? await utils.hashJSON({cleanUrl, params})
    
    if (activeFetches.has(id)) {
        const response = (await activeFetches.get(id)).clone()
        return callback(response)
    }

    let controller
    if (!signal) {
        controller = createAbortController({name: 'Fetch', timeout: 60000})
        signal = controller.signal
    }
    
    const fetchPromise = fetch(cleanUrl, {
        ...params, 
        cache: 'no-store',
        signal,
    }).then(async response => {
        if (!response.ok) {
            throw new Error(`Fetch failed: ${response.status} ${response.statusText}`)
        }
        return response
    }).catch(error => {
        throw error
    }).finally(() => {
        controller?.close()
        setTimeout(() => activeFetches.delete(id), 2000)
    })

    activeFetches.set(id, fetchPromise)
    const response = (await fetchPromise).clone()
    return callback ? callback(response) : response
}

export const activeJSONParsing = new Map()

export const parseJSONResponse = async (response, {
    id, timeout = 60000,
} = {}) => {
    if (id && activeJSONParsing.has(id)) {
        return activeJSONParsing.get(id)
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
                setTimeout(() => activeJSONParsing.delete(id), 2000)
            }
        }
    })()

    if (id) {
        activeJSONParsing.set(id, parsePromise)
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

export const createAbortController = ({
    name='Process',
    handler, 
    timeout, 
    events,
}={}) => {
    const controller = new AbortController()
    const {signal} = controller

    const abort = (message='unknown') => {
        return () => {
            if (!signal.aborted) {
                controller.abort(`${name} aborted: ${message}`)
            }
        }
    }

    controller.close = abort(`completed`)

    if (typeof handler === 'function') {
        signal.addEventListener("abort", handler)
    }
    
    if (typeof timeout === 'number') {
        const timeoutAbort = abort(`exceeded timeout (${timeout} ms)`)
        const timer = setTimeout(timeoutAbort, timeout)
        signal.addEventListener('abort', () => clearTimeout(timer))
    }
    
    if (Array.isArray(events)) {
        events.forEach(([el, types]) => types.forEach(type => {
            const eventAbort = abort(`${el.id || el.tagName} ${type}`)
            el.addEventListener(type, eventAbort)
            signal.addEventListener('abort', () => el.removeEventListener(type, eventAbort))
        }))
    }
    
    return controller
}

export const formatRelativeDate = (date) => {
  const now = new Date()
  const diffMs = now - date
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHr = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHr / 24)

  if (diffSec < 60) {
    return `${diffSec} ${diffSec === 1 ? 'second' : 'seconds'} ago`
  } else if (diffMin < 60) {
    return `${diffMin} ${diffMin === 1 ? 'minute' : 'miutes'} ago`
  } else if (diffHr < 24) {
    return `${diffHr} ${diffHr === 1 ? 'hour' : 'hours'} ago`
  } else if (diffDay < 7) {
    return `${diffDay} ${diffDay === 1 ? 'day' : 'days'} ago`
  } else {
    return formatDate(date)
  }
}

export const formatDate = (date, {
    filename=false,
    time=false,
    numeric=false,
}={}) => {
    if (filename) {
        const year = String(date.getFullYear())
        const month = String(date.getMonth() + 1).padStart(2, "0")
        const day = String(date.getDate()).padStart(2, "0")
        return `${year}${month}${day}`
    }

    return date.toLocaleString("en-US", {
        year: "numeric",
        month: numeric ? "2-digit" : "long",
        day: numeric ? "2-digit" : "numeric",
        ...(time ? {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
            timeZoneName: "short"
        } : {})
    })
}

export const getBaseURL = (urlString) => {
    try {
        const url = new URL(urlString)
        url.search = ''
        return url.toString()
    } catch {
        return urlString
    }
}

export const fileToDataURL = async (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()

        reader.onload = (e) => {
            resolve(e.target.result)
        }

        try {
            reader.readAsDataURL(file)
        } catch {
            resolve('')
        }
    })
}