import { useEffect, useState, useContext, useRef, ReactElement } from 'react'

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
  error: Error
  query: () => Promise<void>
  isLoading: boolean
  isLoadingMore: boolean
  isRefetching: boolean
  loadMore: (arg0: string, arg1?: Variables) => Promise<any>
  refetch: () => Promise<any>
  setData: (arg0: any[] | object) => void
}

interface Props {
  endpoint: string
  variables?: Variables
  children: (arg0: Children) => ReactElement
  fetchOptions?: { [key: string]: string | number | object }
  onComplete?: (arg0?: any) => void
  refetchOnMount?: boolean
  isHook?: boolean
}

const Query = ({
  children,
  endpoint,
  variables,
  fetchOptions,
  onComplete,
  refetchOnMount = false,
  isHook = false,
}: Props) => {
  const {
    requester,
    url,
    key,
    persistentStorage,
    refetchForEndpoints,
    removeFetchEndpoint,
    storageAsync,
    data,
    setData,
  } = useContext(NetworkQueryContext)

  const interpolatedEndpoint =
    variables && !isObjectEmpty(variables)
      ? interpolateString(endpoint, variables)
      : endpoint
  const builtUrl = buildUrl(interpolatedEndpoint, url)

  const syncStorageData = !storageAsync
    ? getStorageItemSync(persistentStorage, STORAGE_KEY, endpoint)
    : undefined

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
          endpoint,
        )

        setData((state: any) => ({ ...state, [endpoint]: storageData }))
        setIsLoading(false)
      }

      const response = await requester(builtUrl, config, variables)

      setData((state: any) => ({ ...state, [endpoint]: response.data }))

      if (typeof onComplete === 'function') {
        onComplete(response.data)
      }

      setStorageItem(persistentStorage, STORAGE_KEY, endpoint, response.data)
    } catch (err) {
      if (typeof onComplete === 'function') {
        onComplete(err)
      }

      setError(err)
    } finally {
      setIsLoading(false)
    }
  }

  const refetch = async () => {
    setIsRefetching(true)

    try {
      const response = await requester(builtUrl, config, variables)

      setData((state: any) => ({ ...state, [endpoint]: response.data }))

      setStorageItem(persistentStorage, STORAGE_KEY, endpoint, response.data)

      if (typeof onComplete === 'function') {
        onComplete(response.data)
      }

      return response.data
    } catch (err) {
      if (typeof onComplete === 'function') {
        onComplete(err)
      }

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
          endpoint,
        )
      } else if (!storageAsync) {
        loadMoreStorageData = getStorageItemSync(
          persistentStorage,
          STORAGE_KEY,
          endpoint,
        )
      }

      if (loadMoreStorageData) {
        setData((state: any) => ({
          ...state,
          [endpoint]: Array.isArray(state[endpoint])
            ? [...state[endpoint], ...loadMoreStorageData]
            : { ...state[endpoint], ...loadMoreStorageData },
        }))
        setIsLoadingMore(false)
      }

      const response = await requester(loadMoreUrl, config, variables)

      setData((state: any) => ({
        ...state,
        [endpoint]: Array.isArray(state[endpoint])
          ? [...state[endpoint], ...response.data]
          : { ...state[endpoint], ...response.data },
      }))

      setStorageItem(
        persistentStorage,
        STORAGE_KEY,
        interpolatedLoadMoreEndpoint,
        response.data,
      )

      return response.data
    } catch (err) {
      setError(err)
    } finally {
      setIsLoadingMore(false)
    }
  }

  // This handles refetches after mutations
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

      if (isMounted.current) {
        initFetch()
      }
    }
  }, [key])

  const isMounted = useRef(false)

  // This is used for the initial mount of the component
  useEffect(() => {
    if (!isHook) {
      if (!data[endpoint] || refetchOnMount) {
        initFetch()
      }
    }

    isMounted.current = true
  }, [])

  return children({
    data: data[endpoint],
    error,
    isLoading,
    isLoadingMore,
    isRefetching,
    loadMore,
    query: initFetch,
    refetch,
    setData: (newData: any[] | object) => {
      setData((state: object) => ({
        ...state,
        [endpoint]: newData,
      }))
    },
  })
}

export const useQuery = ({
  ...args
}: Pick<Props, Exclude<keyof Props, 'children'>>): Children => {
  const children = (params: Children) => params

  // @ts-ignore
  return Query({ ...args, children, isHook: true })
}

export default Query
