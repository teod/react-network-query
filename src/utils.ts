import { PersistentStorage } from './types'

const isValidUrl = (str: string) => {
  try {
    // tslint:disable-next-line
    new URL(str)
    return true
  } catch (_) {
    return false
  }
}

const combineUrl = (endpoint: string, baseUrl: string = '') => {
  if (endpoint.startsWith('/') && baseUrl.endsWith('/')) {
    return `${baseUrl}${endpoint.substring(1)}`
  }

  if (endpoint.startsWith('/') && !baseUrl.endsWith('/')) {
    return `${baseUrl}${endpoint}`
  }

  if (!endpoint.startsWith('/') && !baseUrl.endsWith('/')) {
    return `${baseUrl}/${endpoint}`
  }

  return endpoint
}

export const buildUrl = (endpoint: string, baseUrl?: string) => {
  if (isValidUrl(endpoint)) {
    return endpoint
  }

  if (baseUrl && isValidUrl(baseUrl)) {
    return combineUrl(endpoint, baseUrl)
  }

  throw new Error(
    'Endpoint is not a valid url, please either provide a base url, or a valid endpoint',
  )
}

export const isObjectEmpty = (obj?: { [key: string]: any }) =>
  typeof obj === 'object' &&
  Object.entries(obj).length === 0 &&
  obj.constructor === Object

export const interpolateString = (
  str: string,
  values: { [key: string]: string | number },
) => {
  if (/[a-zA-Z\_]+/g.test(str)) {
    return Object.keys(values).reduce((acc, key) => {
      return acc.replace(
        new RegExp('{{(?:\\s+)?(' + key + ')(?:\\s+)?}}'),
        String(values[key]),
      )
    }, str)
  }

  return str
}

export const guidGenerator = () => {
  const S4 = () =>
    (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1)

  return (
    S4() +
    S4() +
    '-' +
    S4() +
    '-' +
    S4() +
    '-' +
    S4() +
    '-' +
    S4() +
    S4() +
    S4()
  )
}

export const fetchHandler = (url: string, options: { [key: string]: any }) => {
  const handleResponse = (response: any) => {
    const { headers } = response
    const contentType = headers.get('Content-Type')
    const isJSON = contentType && contentType.indexOf('application/json') !== -1

    if (response.ok) {
      if (isJSON) {
        return new Promise(resolve => {
          response.json().then((data: any) =>
            resolve({
              data,
            }),
          )
        })
      }
    } else {
      if (isJSON) {
        return response.json().then((jsonError: Error) => {
          throw Error(JSON.stringify(jsonError))
        })
      }

      throw Error(JSON.stringify(response))
    }
  }

  return fetch(url, options).then(handleResponse)
}

export const getStorageItemSync = (
  persistentStorage: PersistentStorage | undefined,
  storageKeyPrefix: string,
  storageKey: string,
) => {
  if (persistentStorage && persistentStorage.setItem) {
    try {
      return JSON.parse(
        persistentStorage.getItem(`${storageKeyPrefix}${storageKey}`),
      )
    } catch (err) {
      persistentStorage.removeItem(`${storageKeyPrefix}${storageKey}`)
    }
  }
}

export const setStorageItem = async (
  persistentStorage: PersistentStorage | undefined,
  storageKeyPrefix: string,
  storageKey: string,
  value: any,
) => {
  if (persistentStorage && persistentStorage.setItem) {
    await persistentStorage.setItem(
      `${storageKeyPrefix}${storageKey}`,
      JSON.stringify(value),
    )
  }
}

export const getStorageItem = async (
  persistentStorage: PersistentStorage | undefined,
  storageKeyPrefix: string,
  storageKey: string,
) => {
  if (persistentStorage && persistentStorage.setItem) {
    try {
      const persistentItem = await persistentStorage.getItem(
        `${storageKeyPrefix}${storageKey}`,
      )

      return JSON.parse(persistentItem)
    } catch (err) {
      persistentStorage.removeItem(`${storageKeyPrefix}${storageKey}`)
    }
  }
}
