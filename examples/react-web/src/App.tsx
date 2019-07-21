import React from 'react'
import axios from 'axios'

import { NetworkQueryProvider, Query, Mutation } from 'react-network-query'

let page = 0

const App: React.FC = () => {
  return (
    <div style={{ textAlign: 'center' }}>
      <NetworkQueryProvider
        url="http://localhost:3001"
        requester={axios}
        persistentStorage={localStorage}
        clearPersistentStorage={false}
        storageAsync={false}
      >
        <Query
          endpoint="/users?_page={{page}}&_limit={{limit}}"
          variables={{ page, limit: 5 }}
          fetchOptions={{ headers: { 'Content-Type': 'application/json' } }}
          onComplete={data => {
            console.log('request complete', data)
          }}
        >
          {({ data, isLoading, loadMore, isLoadingMore, error, refetch }) =>
            isLoading ? (
              <div>Loading...</div>
            ) : error ? (
              <div>Something went wrong</div>
            ) : (
              <Mutation
                endpoint="/users/1" // This is overwriten by the update function
                method="PATCH" // This is overwriten by the update function
                body={{ name: 'Updated Name', email: 'update@email.com' }} // This is overwriten by the update function
                refetch={['/users?_page={{page}}&_limit={{limit}}']} // This will refetch only the specified endpoint
                onComplete={response => {
                  console.log('mutaion complete', response)
                }}
              >
                {({ update, isMutating }) => (
                  <div>
                    <button
                      onClick={() => {
                        refetch()
                      }}
                    >
                      Refetch
                    </button>
                    <br />
                    <button
                      onClick={() => {
                        ++page
                        loadMore('/users?_page={{page}}&_limit={{limit}}', {
                          page,
                        })
                      }}
                    >
                      {isLoadingMore ? 'Loading ...' : 'Load more'}
                    </button>
                    <br />
                    <button
                      onClick={() => {
                        update({
                          body: {
                            email: 'overwriten@email.com',
                            name: 'Jon Snow',
                          },
                          endpoint: 'users/{{id}}',
                          method: 'PUT',
                          variables: {
                            id: 1,
                          },
                        })
                      }}
                    >
                      {isMutating ? 'Updating ...' : 'Update user'}
                    </button>
                    <br />
                    {JSON.stringify(data)}
                  </div>
                )}
              </Mutation>
            )
          }
        </Query>
      </NetworkQueryProvider>
    </div>
  )
}

export default App
