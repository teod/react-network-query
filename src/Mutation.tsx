import { useContext, ReactElement, useState } from 'react'

import { NetworkQueryContext } from './Provider'
import { buildUrl, interpolateString, isObjectEmpty } from './utils'

interface Variables {
  [key: string]: string | number
}

type Method = 'POST' | 'PUT' | 'DELETE' | 'PATCH'

interface Common {
  endpoint?: string
  variables?: Variables
  headers?: { [key: string]: string }
  method?: Method
  body?: { [key: string]: any }
}

interface ChildrenArg {
  update: (arg0: Common) => Promise<any>
  isMutating: boolean
}

interface Props extends Common {
  children: ({ update, isMutating }: ChildrenArg) => ReactElement
  refetch?: boolean | string[]
  onComplete?: (arg0: any) => void
}

const Mutation = ({
  children,
  endpoint,
  body,
  variables,
  headers,
  method = 'POST',
  refetch = false,
  onComplete,
}: Props) => {
  const { fetch, url, updateKey } = useContext(NetworkQueryContext)
  const [isMutating, setIsMutating] = useState(false)

  const update = async ({
    endpoint: endpointInline,
    body: bodyInline,
    method: methodInline,
    variables: variablesInline,
    headers: headersInline,
  }: Common) => {
    setIsMutating(true)

    const interpolatedEndpoint =
      (variablesInline || variables) &&
      !isObjectEmpty(variablesInline || variables)
        ? interpolateString(
            endpointInline || endpoint || '',
            variablesInline || variables || {},
          )
        : endpointInline || endpoint || ''
    const builtUrl = buildUrl(interpolatedEndpoint, url)

    const response = await fetch({
      data: bodyInline || body,
      headers: headersInline || headers,
      method: methodInline || method,
      url: builtUrl,
    })

    if (
      (refetch === true || Array.isArray(refetch)) &&
      typeof updateKey === 'function'
    ) {
      updateKey(Array.isArray(refetch) ? refetch : undefined)
    }

    setIsMutating(false)

    if (typeof onComplete === 'function') {
      onComplete(response)
    }

    return response
  }

  return children({ update, isMutating })
}

export default Mutation
