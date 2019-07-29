# React Network Query

[![npm version](https://img.shields.io/npm/v/react-network-query.svg?style=flat-square)](https://www.npmjs.com/package/react-network-query)

React Network Query is a library inspired by [React Apollo](http://dev.apollodata.com/react/), it allows to use simple declarative react components for making network rest requests and saving state in a similar way React Apollo allows to do it for graphql requests.

Think of it as apollo for rest requests.

It works out of the box for React and ReactDOM, there is support for React Native, but it is still experimental.

## Installation

```bash
npm install react-network-query --save
# or using yarn
yarn add react-network-query
```

## Usage

To get started you will need to add a `<NetworkQueryProvider/>` component to the root of your React component tree. This component [provides context](https://reactjs.org/docs/context.html) functionality to all the other components in the application without passing it explicitly:

```js
import { NetworkQueryProvider } from 'react-network-query'

ReactDOM.render(
  <NetworkQueryProvider url="http://api.dev">
    <MyRootComponent />
  </NetworkQueryProvider>,
  document.getElementById('root'),
);
```

Now you may create `<Query>` and `<Mutation>` components in this React tree that are able to make REST network calls and save response as state.

Connect one of your components to your REST server using the `<Query>` component:

```js
import { Query } from 'react-network-query'

const Cats = () => (
  <Query endpoint="/cats">
    {({ data, isLoading, loadMore, error, refetch }) => {
      if (isLoading) {
        return <span>Loading...</span>
      }

      if (error) {
        return <span>Something went wrong</span>
      }

      return (
        <ul>
          {data.map((cat) => (
            <li key={cat.id}>{cat.name}</li>
          ))}
        </ul>
      )
    }
  </Query>
)
```

If you render `<Cats />` within your component tree, you’ll first see a loading state and then a list of cat names once React Network Query finishes to load data from your API.

If you need to make an update request, for one of the `POST | PUT | PATCH | DELETE` methods, you have to use the `<Mutation>` component, and wrap your react elements that will trigger the update:

```js
import { Mutation } from 'react-network-query'

const CatsContainer = () => (
  <>
    <Cats />
    <Mutation endpoint="/cats/create" method="POST" body={{ name: 'Cate' }}>
      {({ update, isMutating }) => (
        <button onClick={() => update()}>
          {isMutating ? 'Creating...' : 'Create new cat'}
        </button>
      )}
    </Mutation>
  </>
)
```

Or you can pass parameters directly to the `update` function:

```js
import { Mutation } from 'react-network-query'

const CatsContainer = () => (
  <>
    <Cats />
    <Mutation>
      {({ update, isMutating }) => (
        <button 
          onClick={
            () => update({
              endpoint: '/cats/create', 
              method="POST" 
              body={{ name: 'Cate' }}
            })
          }
        >
          {isMutating ? 'Creating...' : 'Create new cat'}
        </button>
      )}
    </Mutation>
  </>
)
```

If you render `<CatsContainer />` within your component tree, when the user will click the button a new cat will be created, until the API call is ready, you will see a loading state.

Passing parameters directly to the `update` function will overwrite any corresponding props passed to the `<Mutation />` component.

If you would like to see all of the features `<NetworkQueryProvider />`, `<Query />` and `<Mutation />` supports be sure to check out the [API reference][].

[api reference]: #api-reference

### Usage with hooks

If you prefer using hooks with React Network Query, there are two main exposed hook functions: `useQuery` and `useMutation`, please note that the components which will use those still needs to be wrapped inside `<NetworkQueryProvider />`.

```js
import { useQuery } from 'react-network-query'

const Cats = () => {
  const { data, query, isLoading, error, refetch, loadMore, isLoadingMore } = useQuery({
    endpoint: '/cats?_page={{page}}&_limit={{limit}}',
    variables: {
      limit: 20
      page: 0,  
    },
  })

  // load cats data on mount
  useEffect(() => {
    query()
  }, [])

  if (isLoading) {
    return <span>Loading...</span>
  }

  if (error) {
    return <span>Something went wront.</span>
  }

  return (
    <>
      <ul>
        {data.map(cat => <li key={cat.id}>{cat.name}</li>)}
      </ul>
      <button 
        onClick={
          () => loadMore(
            '/cats?_page={{page}}&_limit={{limit}}', 
            { limit: 20, page: 1 }
          )
        }
      >
        Load more cats
      </button>
      {isLoadingMore && (<span>Loading more cats...</span>)}
      <button onClick={() => refetch()}>
        Refetch cats
      </button>
    </>
  )
}
```

If you render `<Cats />` within your component tree, the cats will be fetched from the API when the component will mount, it has the same functionality as the `<Query />` component.
You can control when the actual initial fetch takes place using the `query` function exposed by the `useQuery` hook.
The `useQuery` interface is virtually the same as the `<Query />` component one.

For making a `POST | PUT | PATCH | DELETE` network call you can use the `useMutation` hook:

```js
import { useMutation } from 'react-network-query'

const CatsContainer = () => {
  const { update, isMutating, error } = useMutation({
    endpoint: '/cats',
    method: 'POST',
  })

  return (
    <>
      <Cats />
      <button onClick={() => update({ body: { name: 'Mr. Whiskers' } })}>
        {isMutating ? 'Loading...' : 'Create cat'}
      </button>
      {error && (<span>Something went wrong</span>)}
    </>
  )
}
```

If you render `<CatsContainer />` within your component tree, when the user will click the Create cat button a new POST network request will be made, which will create a new cat.
The `useMutation` interface is virtually the same as the `<Mutation />` component one.

**`We recommend using the <Query /> and <Mutation /> components instead of hooks, using a more declative way of writing your react components.`**

### Local state update

There are cases when you want to update the local state without letting/waiting for the network call to finish, or you need to reflect certain local changes in the UI, for this a `setData` function is exposed, it receives the update piece of data for that specific endpoint:

```js
import { Query } from 'react-network-query'

const Cats = () => (
  <Query endpoint="/cats">
    {({ data, setData}) => (
      <>
        <ul>
          {data.map((cat) => (
            <li key={cat.id}>{cat.name}</li>
          ))}
        </ul>
        <button
          onClick={() => {
            const updatedCats = data.map(cat => ({
              ...cat,
              food: 'whiskas',
            }))

            setData(updatedCats)
          }}
        >
          Add food
        </button>
      </>
    )}
  </Query>
)
```
or using a hook:
```js
import { useQuery } from 'react-network-query'

const Cats = () => {
  const { data = [], query, setData } = useQuery({ endpoint: '/cats' })

  return (
    <>
      <ul>
        {data.map((cat) => (
          <li key={cat.id}>{cat.name}</li>
        ))}
      </ul>
      <button
        onClick={() => {
          const updatedCats = data.map(cat => ({
            ...cat,
            food: 'whiskas',
          }))

          setData(updatedCats)
        }}
      >
        Add food
      </button>
      <button onClick={() => query()}>
        Fetch cats
      </button>
    </>
  )
}
```

## API Reference

### `<NetworkQueryProvider />`

| Prop                    | Default |                  Type                   | Description                                                                                                                                                                                                                                                                                                  |
| :---------------------- | :-----: | :-------------------------------------: | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| children                |    -    |             `ReactElement`              | Required prop, element(s) that will be wrapped into React Network Query context.                                                                                                                                                                                                                             |
| url?                    |    -    |                `string`                 | Base URL used to construct all of the endpoints, this can be overwritten and extended by each `<Query />` component with the `endpoint` prop.                                                                                                                                                                |
| requester?              |  fetch  | `fetch or AxiosInstance or AxiosStatic` | Request function to make all of the network calls with, by default `window.fetch` is used. We strongly recommend using axios instead. If you want to pass a custom request function, you will have to wrap it in a similar interface axios and fetch uses.                                                   |
| persistentStorage?      |    -    |           `PersistentStorage`           | A storage interface used for persistent saving of data. When it is passed data will be automatically persisted into the specified storage. It works out of the box with `window.localStorage`. For a custom persistent storage interface you will have to rewire it to be compliant with `PersistentStorage` |
| clearPersistentStorage? |  false  |                `boolean`                | If passed as `true` the persistent storage will be cleared on Provider's initialization, works only if `persistentStorage?` prop has been passed as well.                                                                                                                                                    |
| storageAsync?           |  false  |                `boolean`                | Pass `true` if the persistent storage interface you are using works asynchronously (with promises).                                                                                                                                                                                                          |

### `<Query />`
| Prop            | Default |                      Type                       | Description                                                                                                                                                                                                                                                                           |
| :-------------- | :-----: | :---------------------------------------------: | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| children        |    -    |    `(arg0: QueryRenderArg) => ReactElement`     | Required prop, needs to be a function that will return a valid react element.                                                                                                                                                                                                         |
| endpoint        |    -    |                    `string`                     | Required prop, the endpoint for which to make the network call. It will be concatenated to the `url` prop passed to the `<NetworkQueryProvider />` if any. In case the endpoint is a valid url by itself e.g. `https://local.dev/cats` it will disregard the base `url` prop overall. |
| variables?      |    -    |      `{ [key: string]: string or number }`      | key -> value pairs, used for interpolating the endpoint using moustache.js like handlebars syntax e.g. for `/cats/{{id}}` endpoint a `{ id: 2 }` variables object can be passed.                                                                                                      |
| fetchOptions?   |    -    | `{ [key: string]: string or number or object }` | Additional options to be attached to the network request. The provided options depend on the requester instance used, so please consult axios/fetch api reference accordingly.                                                                                                        |
| onComplete?     |    -    |              `(arg0: any) => void`              | Callback triggered when the network call is finished, it receives the returned network request data as a parameter on success and the Error instance in case of failure.                                                                                                              |
| refetchOnMount? |  false  |                    `boolean`                    | If passed as `true` it will do the request for the specified `endpoint` prop, even if data has already been fetched and it is saved in the state manager.                                                                                                                             |

### `<Mutation />`
| Prop          | Default |                                                    Type                                                     | Description                                                                                                                                                                                                                                                                                                 |
| :------------ | :-----: | :---------------------------------------------------------------------------------------------------------: | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| children      |    -    | `({ update, isMutating, error }: { update: UpdateArg, isMutation: boolean, error: Error }) => ReactElement` | Required prop, needs to be a function that will return a valid react element. It provides an `update` function to do the network request and an `isMutating` state for showing the current status of the network request.                                                                                   |
| refetch?      |    -    |                                            `boolean or string[]`                                            | If provided as true, it will trigger a refetch for all `<Query />` components rendered in the current tree. It can receive a list of endpoints instead of a boolean value, in this case, it will trigger the refetch only for those `<Query />` components that have the exact provided `endpoint` as prop. |
| onComplete?   |    -    |                                            `(arg0: any) => void`                                            | Callback triggered when the network call is finished, it receives the returned network request data as a parameter on success, and Error instance in case of failure.                                                                                                                                       |
| fetchOptions? |    -    |                               `{ [key: string]: string or number or object }`                               | Additional options to be attached to the network request. The provided options depend on the requester instance used, so please consult axios/fetch api reference accordingly.                                                                                                                              |

The `<Mutation />` component also inherits all `UpdateArg Interface`. The arguments used by the `update` function will always overwrite those ones passed directly as props to the `<Mutation />` component.

### `UpdateArg Interface`
| Prop       |                 Type                  | Description                                                                                                                                                                                                                                                   |
| :--------- | :-----------------------------------: | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| endpoint?  |               `string`                | The endpoint for which to make the network call, it will be concatenated to the `url` prop passed to `<NetworkQueryProvider />` if any. In case the endpoint is a valid url by itself e.g. `https://local.dev/cats` it will disregard the base `url` overall. |
| variables? | `{ [key: string]: string or number }` | key -> value pairs, for interpolating the endpoint using moustache.js like handlebars syntax e.g. for `/cats/{{id}}` endpoint an `{ id: 2 }` variables object can be passed.                                                                                  |
| method?    |   `POST or PUT or DELETE or PATCH`    | Network method for which the call should be made for.                                                                                                                                                                                                         |
| body?      |       `{ [key: string]: any }`        | The network request body.                                                                                                                                                                                                                                     |

### `QueryRenderArg Interface`
| Prop          |                                         Type                                          | Description                                                                                                                                                                                                                  |
| :------------ | :-----------------------------------------------------------------------------------: | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| data          |                                         `any`                                         | The data returned by the rest network api call.                                                                                                                                                                              |
| isLoading     |                                       `boolean`                                       | State of the very first network request, triggered on component mount.                                                                                                                                                       |
| error         |                                        `Error`                                        | The returned Error instance in case of network failure.                                                                                                                                                                      |
| refetch       |                                 `() => Promise<any>`                                  | Refetches the data, useful for triggering refreshes.                                                                                                                                                                         |
| loadMore      | `(endpoint: string, variables?: { [key: string]: string or number }) => Promise<any>` | Function used for loading more data, useful on paginations, the first parameter is the endpoint for which to make the network call, and the second parameter is variables object used for interpolating the endpoint string. |
| isLoadingMore |                                       `boolean`                                       | State of the network request triggered by `loadMore` function.                                                                                                                                                               |
| setData       |                           `(arg0: any[] | object) => void`                            | An exposed function for updating localy the state data for a specific Query, this can be used for optimistic updates.                                                                                                        |

### `PeristentStorage Interface`
| Prop       |                Type                 | Description                                                              |
| :--------- | :---------------------------------: | :----------------------------------------------------------------------- |
| setItem    | `(key: string, value: any) => void` | Function for setting a single key -> value pair into persistent storage. |
| getItem    |       `(key: string) => any`        | Function for retrieving data for a specific key from persistent storage. |
| removeItem |       `(key: string) => void`       | Function for deleting data for a specific key from persistent storage.   |

## Use a custom requester

If you need to use a custom requester for network requests please refer to the [CUSTOM_REQUESTER](/CUSTOM_REQUESTER.md) documentation for an example on how you can write your own.

## Examples
[React Web](/examples/react-web)