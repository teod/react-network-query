import { useEffect, useState, useContext, ReactElement } from 'react'

import { NetworkQueryContext, STORAGE_KEY } from './Provider'
import { buildUrl, interpolateString, isObjectEmpty } from './utils'

interface Variables {
  [key: string]: string | number
}

interface Children {
  data: any
  isLoading: boolean
  error: Error
  refetch: () => Promise<any>
  isRefetching: boolean
  loadMore: (arg0: string, arg1?: Variables) => Promise<any>
  isLoadingMore: boolean
}

interface Props {
  endpoint: string
  variables?: Variables
  children: (arg0: Children) => ReactElement
  headers?: { [key: string]: string }
  onComplete?: (arg0: any) => void
}

const Query = ({
  children,
  endpoint,
  variables,
  headers,
  onComplete,
}: Props) => {
  const {
    fetch,
    url,
    key,
    persistentStorage,
    refetchForEndpoints,
    removeFetchEndpoint,
  } = useContext(NetworkQueryContext)

  const setStorageItem = (storageKey: string, value: any) => {
    if (persistentStorage && persistentStorage.setItem) {
      persistentStorage.setItem(
        `${STORAGE_KEY}${storageKey}`,
        JSON.stringify(value),
      )
    }
  }

  const getStorageItem = (storageKey: string) => {
    if (persistentStorage && persistentStorage.setItem) {
      return JSON.parse(
        persistentStorage.getItem(`${STORAGE_KEY}${storageKey}`),
      )
    }
  }

  const interpolatedEndpoint =
    variables && !isObjectEmpty(variables)
      ? interpolateString(endpoint, variables)
      : endpoint
  const builtUrl = buildUrl(interpolatedEndpoint, url)

  const storageData = getStorageItem(builtUrl)

  const [data, setData] = useState(storageData)
  const [error, setError] = useState()
  const [isLoading, setIsLoading] = useState(storageData ? false : true)
  const [isRefetching, setIsRefetching] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  const config = !isObjectEmpty(headers) ? { headers } : undefined

  const initFetch = async () => {
    try {
      const response = await fetch.get(builtUrl, config)
      setData(response.data)

      if (typeof onComplete === 'function') {
        onComplete(response.data)
      }

      setStorageItem(builtUrl, response.data)
    } catch (err) {
      setError(err)
    } finally {
      setIsLoading(false)
    }
  }

  const refetch = async () => {
    setIsRefetching(true)

    try {
      const response = await fetch.get(builtUrl, config)
      setData(response.data)

      setStorageItem(builtUrl, response.data)

      return response.data
    } catch (err) {
      setError(err)
    } finally {
      setIsRefetching(false)
    }
  }

  const loadMore = async (
    loadMoreEndpoint: string,
    extraVariables: Variables = {},
  ) => {
    setIsLoadingMore(true)

    try {
      const mergedVariables = { ...variables, ...extraVariables }

      const interpolatedLoadMoreEndpoint =
        variables && !isObjectEmpty(mergedVariables)
          ? interpolateString(loadMoreEndpoint, mergedVariables)
          : endpoint

      const loadMoreUrl = buildUrl(interpolatedLoadMoreEndpoint, url)

      const loadMoreStorageData = getStorageItem(builtUrl)

      if (loadMoreStorageData) {
        setData((state: any) =>
          Array.isArray(state)
            ? [...state, ...loadMoreStorageData]
            : { ...state, ...loadMoreStorageData },
        )
        setIsLoadingMore(false)
      }

      const response = await fetch.get(loadMoreUrl, config)
      setData((state: any) =>
        Array.isArray(state)
          ? [...state, ...response.data]
          : { ...state, ...response.data },
      )

      setStorageItem(loadMoreUrl, response.data)

      return response.data
    } catch (err) {
      setError(err)
    } finally {
      setIsLoadingMore(false)
    }
  }

  useEffect(() => {
    initFetch()
  }, [])

  useEffect(() => {
    if (
      (Array.isArray(refetchForEndpoints) &&
        refetchForEndpoints.includes(endpoint)) ||
      refetchForEndpoints === null
    ) {
      if (
        Array.isArray(refetchForEndpoints) &&
        typeof removeFetchEndpoint === 'function'
      ) {
        removeFetchEndpoint(endpoint)
      }

      initFetch()
    }
  }, [key])

  return children({
    data,
    error,
    isLoading,
    isLoadingMore,
    isRefetching,
    loadMore,
    refetch,
  })
}

export default Query
