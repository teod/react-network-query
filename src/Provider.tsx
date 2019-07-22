import React, { ReactElement, useState, useEffect } from 'react'

import { guidGenerator, fetchHandler } from './utils'
import { PersistentStorage } from './types'

interface Context {
  requester: any
  url?: string
  key?: string
  updateKey?: (arg0?: string[]) => void
  persistentStorage?: PersistentStorage
  refetchForEndpoints?: string[] | null
  removeFetchEndpoint?: (arg0: string) => void
  storageAsync?: boolean
  data: { [key: string]: any }
  setData: (arg0: any) => void
}

interface Props {
  children: ReactElement | ReactElement[]
  url?: string
  headers?: { [key: string]: string }
  persistentStorage?: PersistentStorage
  clearPersistentStorage?: boolean
  requester?: any
  storageAsync?: boolean
}

const initKey = guidGenerator()

const purgePersistentStorage = (persistentStorage: PersistentStorage) => {
  const items = { ...persistentStorage }

  Object.keys(items).forEach((itemKey: string) => {
    if (itemKey.includes(STORAGE_KEY)) {
      persistentStorage.removeItem(itemKey)
    }
  })
}

const getRequester = (requester: any) =>
  requester === fetch ? fetchHandler : requester

export const STORAGE_KEY = 'react-network-query'

export const NetworkQueryContext = React.createContext<Context>({
  data: {},
  key: initKey,
  requester: fetch,
  setData: (item: any) => null,
  url: '',
})

const NetworkQueryProvider = ({
  children,
  url = '',
  persistentStorage,
  clearPersistentStorage = false,
  requester = fetch,
  storageAsync = false,
}: Props) => {
  const [data, setData] = useState({})
  const [key, setKey] = useState(initKey)
  const [refetchForEndpoints, setRefetchForEndpoints] = useState<
    string[] | null
  >(null)

  useEffect(() => {
    if (clearPersistentStorage === true && persistentStorage) {
      purgePersistentStorage(persistentStorage)
    }
  }, [])

  const updateKey = (endpoints?: string[]) => {
    if (Array.isArray(endpoints)) {
      setRefetchForEndpoints(endpoints)
    }

    setKey(guidGenerator)
  }

  const removeFetchEndpoint = (endpoint: string) => {
    setRefetchForEndpoints(state =>
      Array.isArray(state) ? state.filter(v => v !== endpoint) : null,
    )
  }

  return (
    <NetworkQueryContext.Provider
      value={{
        data,
        key,
        persistentStorage,
        refetchForEndpoints,
        removeFetchEndpoint,
        requester: getRequester(requester),
        setData,
        storageAsync,
        updateKey,
        url,
      }}
    >
      {children}
    </NetworkQueryContext.Provider>
  )
}

export default NetworkQueryProvider
