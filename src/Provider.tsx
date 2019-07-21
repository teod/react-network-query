import React, { ReactElement, useState, useEffect } from 'react'
import axios, { AxiosInstance } from 'axios'

import { guidGenerator } from './utils'

interface PersistentStorage {
  setItem: (key: string, value: any) => void
  getItem: (key: string) => any
  removeItem: (key: string) => void
}

interface Context {
  fetch: AxiosInstance
  url?: string
  key?: string
  updateKey?: (arg0?: string[]) => void
  persistentStorage?: PersistentStorage
  refetchForEndpoints?: string[] | null
  removeFetchEndpoint?: (arg0: string) => void
}

interface Props {
  children: ReactElement
  url?: string
  headers?: { [key: string]: string }
  persistentStorage?: PersistentStorage
  clearPersistentStorage?: boolean
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

export const STORAGE_KEY = 'react-network-query'

export const NetworkQueryContext = React.createContext<Context>({
  fetch: axios.create(),
  key: initKey,
  url: '',
})

const NetworkQueryProvider = ({
  children,
  url = '',
  headers = {},
  persistentStorage,
  clearPersistentStorage = false,
}: Props) => {
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
        fetch: axios.create({
          headers: {
            ...headers,
            'Content-Type': 'application/json',
          },
          timeout: 1000,
        }),
        key,
        persistentStorage,
        refetchForEndpoints,
        removeFetchEndpoint,
        updateKey,
        url,
      }}
    >
      {children}
    </NetworkQueryContext.Provider>
  )
}

export default NetworkQueryProvider
