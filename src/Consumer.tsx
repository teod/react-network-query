import { useContext, ReactElement } from 'react'

import { NetworkQueryContext } from './Provider'

interface Props {
  children: (arg0: {
    data: any[] | object
    setData: (arg0: any) => void
  }) => ReactElement
}

export const useConsumer = (): [any[] | object, (arg0: any) => void] => {
  const { data, setData } = useContext(NetworkQueryContext)

  return [data, setData]
}

const Consumer = ({ children }: Props) => {
  const [data, setData] = useConsumer()

  return children({ data, setData })
}

export default Consumer
