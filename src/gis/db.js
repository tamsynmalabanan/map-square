export const objectStoreNames = ['data', 'maps']

export const requestGISDB = () => {
    const request = indexedDB.open('gisdb', 1)

    request.onupgradeneeded = (e) => {
        const db = e.target.result
        
        for (const name of objectStoreNames) {
            if (!db.objectStoreNames.contains(name)) {
                db.createObjectStore(name, { keyPath: 'id' })
            }
        }
    }
    
    return request
}

export const getGISDBObjectStore = (e, name, write=false) => {
    const db = e.target.result
    const transaction = db?.transaction([name], write ? 'readwrite' : 'readonly')
    return transaction?.objectStore(name)
}

export const getGISDBKeys = async (name) => {
    return new Promise(async (resolve, reject) => {
        const request = requestGISDB()
        request.onsuccess = (e) => {
            const objectStore = getGISDBObjectStore(e, name)
            const keysRequest = objectStore?.getAllKeys()
        
            keysRequest.onsuccess = () => resolve(keysRequest.result)
            keysRequest.onerror = () => resolve([])
        }
        request.onerror = (e) => resolve([])
    })
}

export const saveToGISDB = async (name, content) => {
    const id = content.id ??= utils.randomId()

    const request = requestGISDB()
    
    request.onsuccess = async (e) => {
        const objectStore = getGISDBObjectStore(e, name, true)
        objectStore.put(content)
    }

    return id
}

export const getFromGISDB = async (name, id) => {
    return new Promise((resolve, reject) => {
        const request = requestGISDB()
  
        request.onsuccess = (e) => {
            const objectStore = getGISDBObjectStore(e, name)
            const dataRequest = objectStore.get(id)
    
            dataRequest.onsuccess = async (e) => {
                const result = e.target.result
                result ? resolve(structuredClone(result)) : resolve(null)
            }
    
            dataRequest.onerror = (e) => {
                reject(e.target.errorCode)
            }
        }
  
        request.onerror = (e) => {
            reject(e.target.errorCode)
        }
    }).catch(error => console.log(error))
}

export const deleteFromGISDB = (name, id) => {
    const request = requestGISDB()
    
    request.onsuccess = (e) => {
        const objectStore = getGISDBObjectStore(e, name, true)
        const deleteRequest = objectStore.delete(id)
    
        deleteRequest.onsuccess = () => {}
        deleteRequest.onerror = (e) => {}
    }
  
    request.onerror = (e) => {}
}

export const clearGISDB = (names=objectStoreNames) => {
    const request = requestGISDB()
    
    request.onsuccess = (e) => {
        const db = e.target.result
        const transaction = db.transaction(names, 'readwrite')

        for (const name of names) {
            const objectStore = transaction.objectStore(name)
            const clearRequest = objectStore.clear()
    
            clearRequest.onsuccess = function () {}
            clearRequest.onerror = function (event) {}
        }
    }
  
    request.onerror = (e) => {}
}