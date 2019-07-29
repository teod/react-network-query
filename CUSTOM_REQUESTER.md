## Using a custom requester with React Network Query

Sometimes using fetch or axios for making network requests is not an option for you. For example the API is served by an SDK for which you have no control of the uderlying network request functionality. In this case you need to write your own custom request function and pass it as a `requester` prop to `NetworkQueryProvider` component. This custom requester needs to work in a similar manner fetch and axios do.

### Example:

**Let's say you are using an SDK which does the network request for you, it may look similar to this:**

```js
import CatsSDK from '@cats/sdk'

CatsSDK.get() // returns all cats
CatsSDK.filter({ color: 'white' }) // filters the cats based on custom parameters
CatsSDK.create() // creates a new cat
CatsSDK.update({ id: 2, food: 'whiskas' }) // updates a specific cat
CatsSDK.remove() // sends the cat to another home
```

**Your custom requester method may look similar to this:**

```js
const requester = (endpoint, config, variables) => {
  switch (endpoint) {
    case 'cats':
      return CatsSDK.get()
    case 'cats/filter':
      const { color, food } = variables
      return CatsSDK.filter({ color, food })
    case 'cats/create':
      return CatsSDK.create(variables)
    case 'cats/update':
      return CatsSDK.update(variables)
    case 'cats/remove':
      const { id } = variables
      return CatsSDK.remove(id)
  }
}
```

**This custom requester needs to be passed as `requester` prop to the `NetworkQueryProvider` component:**

```js
const App = () => (
  <NetworkQueryProvider requester={requester}>
    ...
  </NetworkQueryProvider>
)
```

**Now you can use the `Query` and `Mutation` component the same way you would use them with axios or fetch, but instead of actual endpoints, pass those you declared in the switch statement inside your custom requester function**:

```js
const Cats = () => (
  <>
    <Query endpoint="cats">
      {({ data, isLoading }) => data} // cats data
    </Query>
    <Query endpoint="cats/filter" variables={{ color: 'black', food: 'whiskas' }}>
      {({ data, isLoading }) => data} // filtered cats data
    </Query>
    <Mutation endpoint="cats/create" variables={{ color: 'white', food: 'mice', cute: yes }}>
      {({ update, isMutating }) => update()} // exposed function for creating cats
    </Mutation>
    <Mutation endpoint="cats/updates">
      {({ update, isMutating }) => update({ id: 1, food: 'whiskas' })} // exposed function for updating cats
    </Mutation>    
    <Mutation endpoint="cats/remove">
      {({ update, isMutating }) => update({ id: 5 })} // exposed function for removing cats
    </Mutation>
  </>
)
```

*You can also use hooks if that's what you prefer, please refer to their usage in [README][] file*

[README]: /README.md