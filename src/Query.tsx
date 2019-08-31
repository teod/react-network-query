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

export const useQuery = ({
  endpoint,
  variables,
  fetchOptions,
  onComplete,
  refetchOnMount = false,
  isHook = true,
}: Pick<Props, Exclude<keyof Props, 'children'>>) => {
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
  const [endpoints, setEndpoints] = useState([interpolatedEndpoint])

  const config = !isObjectEmpty(fetchOptions) ? fetchOptions : undefined

  const initFetch = async () => {
    try {
      let setPersistentStorage = true

      // Restore async persistent storage
      if (storageAsync && persistentStorage) {
        getStorageItem(
          persistentStorage,
          STORAGE_KEY,
          interpolatedEndpoint,
        ).then(storageData => {
          if (setPersistentStorage) {
            setData((state: any) => ({
              ...state,
              [interpolatedEndpoint]: storageData,
            }))
            setIsLoading(false)
          }
        })
      }

      const response = await requester(builtUrl, config, variables)
      setPersistentStorage = false

      setData((state: any) => ({
        ...state,
        [interpolatedEndpoint]: response.data,
      }))

      if (typeof onComplete === 'function') {
        onComplete(response.data)
      }

      setStorageItem(
        persistentStorage,
        STORAGE_KEY,
        interpolatedEndpoint,
        response.data,
      )
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

      const dataReset = endpoints
        .filter(endpointValue => endpointValue !== interpolatedEndpoint)
        .reduce(
          (acc, endpointValue: string) => ({
            ...acc,
            [endpointValue]: undefined,
          }),
          {},
        )

      setData((state: any) => ({
        ...state,
        ...dataReset,
        [interpolatedEndpoint]: response.data,
      }))

      setEndpoints((state: string[]) =>
        state.filter(endpointValue => endpointValue === interpolatedEndpoint),
      )

      setStorageItem(
        persistentStorage,
        STORAGE_KEY,
        interpolatedEndpoint,
        response.data,
      )

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

  const setLoadMoreStorageData = (
    storageData: any[] | object | undefined,
    interpolatedLoadMoreEndpoint: string,
  ) => {
    if (storageData) {
      setData((state: any) => ({
        ...state,
        [interpolatedLoadMoreEndpoint]: storageData,
      }))
      setIsLoadingMore(false)
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

      setEndpoints([...new Set([...endpoints, interpolatedLoadMoreEndpoint])])

      const loadMoreUrl = buildUrl(interpolatedLoadMoreEndpoint, url)

      let shouldSetPersistentAsyncStorage = true

      // Restore async persistent storage
      if (storageAsync && persistentStorage) {
        getStorageItem(
          persistentStorage,
          STORAGE_KEY,
          interpolatedLoadMoreEndpoint,
        ).then(loadMoreStorageData => {
          if (shouldSetPersistentAsyncStorage) {
            setLoadMoreStorageData(
              loadMoreStorageData,
              interpolatedLoadMoreEndpoint,
            )
          }
        })
      } else if (!storageAsync && persistentStorage) {
        const loadMoreStorageData = getStorageItemSync(
          persistentStorage,
          STORAGE_KEY,
          interpolatedLoadMoreEndpoint,
        )

        setLoadMoreStorageData(
          loadMoreStorageData,
          interpolatedLoadMoreEndpoint,
        )
      }

      const response = await requester(loadMoreUrl, config, variables)

      shouldSetPersistentAsyncStorage = false

      setData((state: any) => ({
        ...state,
        [interpolatedLoadMoreEndpoint]: response.data,
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
        endpoints.forEach((endpointValue: string) => {
          loadMore(endpointValue)
        })
      }
    }
  }, [key])

  const isMounted = useRef(false)

  // This is used for the initial mount of the component
  useEffect(() => {
    if (!isHook) {
      if (!data[interpolatedEndpoint] || refetchOnMount) {
        initFetch()
      }
    }

    isMounted.current = true
  }, [])

  const mappedValues = endpoints.flatMap(
    (endpointValue: string) => data[endpointValue] || [],
  )

  const queryData = data[interpolatedEndpoint]
    ? Array.isArray(data[interpolatedEndpoint])
      ? [...mappedValues]
      : { ...mappedValues }
    : undefined

  const setLocalData = (newData: any[] | object) => {
    const dataReset = endpoints
      .filter(endpointValue => endpointValue !== interpolatedEndpoint)
      .reduce(
        (acc, endpointValue: string) => ({
          ...acc,
          [endpointValue]: undefined,
        }),
        {},
      )
    setData((state: object) => ({
      ...state,
      ...dataReset,
      [interpolatedEndpoint]: newData,
    }))
  }

  return {
    data: queryData,
    error,
    isLoading,
    isLoadingMore,
    isRefetching,
    loadMore,
    query: initFetch,
    refetch,
    setData: setLocalData,
  }
}

const Query = ({ children, ...restProps }: Props) => {
  const args = useQuery({ ...restProps, isHook: false })

  return children(args)
}

export default Query
