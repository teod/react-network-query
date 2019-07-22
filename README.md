# React Network Query

[![npm version](https://img.shields.io/npm/v/react-network-query.svg?style=flat-square)](https://www.npmjs.com/package/react-network-query)

React Network Query is a library inspired by [React Apollo](http://dev.apollodata.com/react/), it allow to use simple react components for making network rest requests in a similar way React Apollo allows to do it for graphql requests.

Think of it as apollo for rest requests.

It works out of the box for React and ReactDOM, there is still ongoing work for React Native support.

## Installation

```bash
npm install react-network-query --save
# or using yarn
yarn add react-network-query
```

## Usage

To get started you will need to add a `<NetworkQueryProvider/>` component to the root of your React component tree. This component [provides](https://reactjs.org/docs/context.html) the React Network Query functionality to all the other components in the application without passing it explicitly:

```js
import { NetworkQueryProvider } from 'react-network-query'

ReactDOM.render(
  <NetworkQueryProvider url="http://api.dev">
    <MyRootComponent />
  </NetworkQueryProvider>,
  document.getElementById('root'),
);
```

Now you may create `<Query>` and `<Mutation>` components in this React tree that are able to make REST network calls.

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

If you render `<Cats />` within your component tree, you’ll first see a loading state and then a list of cat names once React Network Query finishes to load data from your api.

If you need to make an update request, for one of the `POST | PUT | PATCH | DELETE `methods, you have to use the `<Mutation>` component, you can connect one of your component wiht it:

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

If you render `<CatsContainer />` within your component tree, when the user will click the button a new cat will be created, until the api call is ready, you will see a loading state.

Passing parameters directly to the `update` function will overwrite any props passed to the `<Mutation />` component.

If you would like to see all of the features `<NetworkQueryProvider />`, `<Query />` and `<Mutation />` supports be sure to check out the [API reference][].

[api reference]: #api-reference

### Usage with hooks

If you prefer using hooks React Network Query exposts an api for those as well, there are two main hook functions exposes `useQuery` and `useMutation`, please note that the component that uses those still needs to be wrapped inside `<NetworkQueryProvider />`.

```js
import { useQuery } from 'react-network-query'

const Cats = () => {
  const { data, isLoading, error, refetch, loadMore, isLoadingMore } = useQuery({
    endpoint: '/cats?_page={{page}}&_limit={{limit}}',
    variables: {
      limit: 20
      page: 0,  
    },
  })

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

If you render `<Cats />` within your component tree, the cats will be fetched from the api when on component mount, with the same functionality as the `<Query />` component works.
The `useQuery` interface is virtually the same as `<Query />` component.

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

If you render `<CatsContainer />` within your component tree, when the user will click the button a new POST network request will be made, which will create a new cat.
The `useMutation` interface is virtually the same as `<Mutation />` component.

**`We recommend using the <Query /> and <Mutation /> components over hooks exposing a more declative API.`**

## API Reference

### `<NetworkQueryProvider />`

| Prop                    | Default |                 Type                  | Description                                                                                                                                                                                                                                                        |
| :---------------------- | :-----: | :-----------------------------------: | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| children                |    -    |            `ReactElement`             | Required prop, elements that will be wrapped into React Network Query context.                                                                                                                                                                                     |
| url?                    |    -    |               `string`                | Base url used to construct all of the endpoints, this can be overwritten by each `<Query />` component with the `endpoint` prop.                                                                                                                                   |
| requester?              |  fetch  | `fetch | AxiosInstance | AxiosStatic` | Request function to make all of the network calls, by default fetch is used, we strongly recommend using axios, if you want to pass a custom request function, you will have to wrap it in a similar interface axios and fetch uses.                               |
| persistentStorage?      |    -    |          `PersistentStorage`          | A storage interface, when passed data will be automatically persisted into the spcified storage, it works out of the box with `window.localStorage`. For a custom persistent storage interface you will have to rewire it to be compliant with `PersistentStorage` |
| clearPersistentStorage? |  false  |               `boolean`               | If passed as `true` the persistent storage will be cleared on Providers'  initialization, works only if `persistentStorage?` prop has been passed                                                                                                                  |
| storageAsync?           |  false  |               `boolean`               | Pass `true` if the persistent storage interface you use works asynchronously (with promises)                                                                                                                                                                       |

### `<Query />`
| Prop            | Default |                     Type                      | Description                                                                                                                                                                                                                                                            |
| :-------------- | :-----: | :-------------------------------------------: | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| children        |    -    |   `(arg0: QueryRenderArg) => ReactElement`    | Required prop, needs to be a function that will return valid react elements.                                                                                                                                                                                           |
| endpoint        |    -    |                   `string`                    | Required prop, the endpoint for which to make network call, it will be concatenated to the `url` prop passed to `<NetworkQueryProvider />` if any, in case the endpoint is a valid url by itself e.g. `https://local.dev/cats` it will disregard the base url overall. |
| variables?      |    -    |     `{ [key: string]: string | number }`      | key -> value pairs, for interpolating the endpoint using moustache.js like handlebars e.g. for `/cats/{{id}}` endpoint a `{ id: 2 }` variables object can be passed.                                                                                                   |
| fetchOptions?   |    -    | `{ [key: string]: string | number | object }` | Additional options to be attached to the network request. The provided options depend on the requester instance used, so please consult axios/fetch api reference accordingly.                                                                                         |
| onComplete?     |    -    |             `(arg0: any) => void`             | Callback triggered when the network call is finished, it receives the returned network request data as a parameter.                                                                                                                                                    |
| refetchOnMount? |  false  |                   `boolean`                   | If passed as `true` it will do the request for specified endpoint, even if data has already been fetched and is saved inside context state.                                                                                                                            |

### `<Mutation />`
| Prop          | Default |                                                    Type                                                     | Description                                                                                                                                                                                                                                                 |
| :------------ | :-----: | :---------------------------------------------------------------------------------------------------------: | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| children      |    -    | `({ update, isMutating, error }: { update: UpdateArg, isMutation: boolean, error: Error }) => ReactElement` | Required prop, needs to be a function that will return valid react elements, it provides an `update` function to do the network request and an `isMutating` state for showing the current status of the network request.                                    |
| refetch?      |    -    |                                            `boolean | string[]`                                             | If provided as true, it will trigger a refetch for all `<Query />` components rendered in the current tree, it can receive a list of endpoints instead, this will trigger the refetch only for those `<Query />` uses that has the exact provided endpoint. |
| onComplete?   |    -    |                                            `(arg0: any) => void`                                            | Callback triggered when the network call is finished, it receives the returned network request data as a parameter.                                                                                                                                         |
| fetchOptions? |    -    |                                `{ [key: string]: string | number | object }`                                | Additional options to be attached to the network request. The provided options depend on the requester instance used, so please consult axios/fetch api reference accordingly.                                                                              |

The `<Mutation />` component also inherits all `UpdateArg Interface`, thye triggered params by the `update` function will always overwrite those ones passed directly as props to the `<Mutation />` component.

### `UpdateArg Interface`
| Prop       |                 Type                 | Description                                                                                                                                                                                                                                             |
| :--------- | :----------------------------------: | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| endpoint?  |               `string`               | The endpoint for which to make network call, it will be concatenated to the `url` prop passed to `<NetworkQueryProvider />` if any, in case the endpoint is a valid url by itself e.g. `https://local.dev/cats` it will disregard the base url overall. |
| variables? | `{ [key: string]: string | number }` | key -> value pairs, for interpolating the endpoint using moustache.js like handlebars e.g. for `/cats/{{id}}` endpoint a `{ id: 2 }` variables object can be passed.                                                                                    |
| method?    |    `POST | PUT | DELETE | PATCH`     | Network method for which the call should be made for.                                                                                                                                                                                                   |
| body?      |       `{ [key: string]: any }`       | The network request body.                                                                                                                                                                                                                               |

### `QueryRenderArg Interface`
| Prop          |                                    Type                                     | Description                                                                                                                                                                                                           |
| :------------ | :-------------------------------------------------------------------------: | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| data          |                                    `any`                                    | The data returned by the rest network api call.                                                                                                                                                                       |
| isLoading     |                                  `boolean`                                  | State of the very first network requests, triggered on component mount.                                                                                                                                               |
| error         |                                   `Error`                                   | The returned error object in case of network failure.                                                                                                                                                                 |
| refetch       |                            `() => Promise<any>`                             | Refetches the data, useful for triggering refreshes.                                                                                                                                                                  |
| loadMore      | `(arg0: string, arg1?: { [key: string]: string | number }) => Promise<any>` | Function used for loading more data, useful on paginations, the first parameter is the endpoint for which to make the network call, and the second parameter is variables used for interpolating the endpoint string, |
| isLoadingMore |                                  `boolean`                                  | State of the network requests triggered by `loadMore` function.                                                                                                                                                       |

### `PeristentStorage Interface`
| Prop       |                Type                 | Description                                                              |
| :--------- | :---------------------------------: | :----------------------------------------------------------------------- |
| setItem    | `(key: string, value: any) => void` | Function for setting a single key -> value pair into persistent storage. |
| getItem    |       `(key: string) => any`        | Function for retrieving data for a specific key from persistent storage. |
| removeItem |       `(key: string) => void`       | Function for deleting data for a specific key from persistent storage.   |

## Examples
[React Web](/examples/react-web)