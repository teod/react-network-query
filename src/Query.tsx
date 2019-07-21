import { useEffect, useState, useContext, ReactElement } from 'react'

import { NetworkQueryContext, STORAGE_KEY } from './Provider'
import {
  buildUrl,
  interpolateString,
  isObjectEmpty,
  getStorageItemSync,
  getStorageItem,
  setStorageItem,
} from './utils'

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
  fetchOptions?: { [key: string]: string | number | object }
  onComplete?: (arg0?: any) => void
}

const Query = ({
  children,
  endpoint,
  variables,
  fetchOptions,
  onComplete,
}: Props) => {
  const {
    requester,
    url,
    key,
    persistentStorage,
    refetchForEndpoints,
    removeFetchEndpoint,
    storageAsync,
  } = useContext(NetworkQueryContext)

  const interpolatedEndpoint =
    variables && !isObjectEmpty(variables)
      ? interpolateString(endpoint, variables)
      : endpoint
  const builtUrl = buildUrl(interpolatedEndpoint, url)

  const syncStorageData = !storageAsync
    ? getStorageItemSync(persistentStorage, STORAGE_KEY, builtUrl)
    : undefined

  const [data, setData] = useState(syncStorageData)
  const [error, setError] = useState()
  const [isLoading, setIsLoading] = useState(syncStorageData ? false : true)
  const [isRefetching, setIsRefetching] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  const config = !isObjectEmpty(fetchOptions) ? fetchOptions : undefined

  const initFetch = async () => {
    try {
      // Restore async persistent storage
      if (storageAsync && persistentStorage) {
        const storageData = await getStorageItem(
          persistentStorage,
          STORAGE_KEY,
          builtUrl,
        )

        setData(storageData)
        setIsLoading(false)
      }

      const response = await requester(builtUrl, config)

      setData(response.data)

      if (typeof onComplete === 'function') {
        onComplete(response.data)
      }

      setStorageItem(persistentStorage, STORAGE_KEY, builtUrl, response.data)
    } catch (err) {
      setError(err)
    } finally {
      if (typeof onComplete === 'function') {
        onComplete()
      }

      setIsLoading(false)
    }
  }

  const refetch = async () => {
    setIsRefetching(true)

    try {
      const response = await requester(builtUrl, config)

      setData(response.data)

      setStorageItem(persistentStorage, STORAGE_KEY, builtUrl, response.data)

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

      let loadMoreStorageData: any

      // Restore async persistent storage
      if (storageAsync && persistentStorage) {
        loadMoreStorageData = await getStorageItem(
          persistentStorage,
          STORAGE_KEY,
          builtUrl,
        )
      } else if (!storageAsync) {
        loadMoreStorageData = getStorageItemSync(
          persistentStorage,
          STORAGE_KEY,
          builtUrl,
        )
      }

      if (loadMoreStorageData) {
        setData((state: any) =>
          Array.isArray(state)
            ? [...state, ...loadMoreStorageData]
            : { ...state, ...loadMoreStorageData },
        )
        setIsLoadingMore(false)
      }

      const response = await requester(loadMoreUrl, config)

      setData((state: any) =>
        Array.isArray(state)
          ? [...state, ...response.data]
          : { ...state, ...response.data },
      )

      setStorageItem(persistentStorage, STORAGE_KEY, loadMoreUrl, response.data)

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
