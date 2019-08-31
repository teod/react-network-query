import React, { useState } from 'react'
import axios from 'axios'
import ReactTable from 'react-table'
import 'react-table/react-table.css'

import { NetworkQueryProvider, Query, Mutation } from 'react-network-query'

const columns = ['name', 'email'].map(value => ({
  Header: value.toUpperCase(),
  accessor: value,
  headerStyle: { whiteSpace: 'unset' },
  style: { whiteSpace: 'unset' },
}))

let page = 1

const App: React.FC = () => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [id, setId] = useState('')

  return (
    <div id="app">
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
          {({
            data,
            isLoading,
            loadMore,
            isLoadingMore,
            error,
            refetch,
            setData,
          }) => {
            if (isLoading) {
              return <div>Loading...</div>
            }

            if (error) {
              return <div>Something went wrong</div>
            }

            return (
              <Mutation
                endpoint="/users/1" // This is overwriten by the update function
                method="PATCH" // This is overwriten by the update function
                body={{ name: 'Updated Name', email: 'update@email.com' }} // This is overwriten by the update function
                refetch={['/users?_page={{page}}&_limit={{limit}}']} // This will refetch only the specified endpoint
                onComplete={response => {
                  console.log('mutation complete', response)
                }}
              >
                {({ update, isMutating }) => (
                  <>
                    <div className="actions">
                      <a
                        className="button"
                        onClick={() => {
                          ++page
                          loadMore('/users?_page={{page}}&_limit={{limit}}', {
                            page,
                          })
                        }}
                      >
                        Load More
                      </a>
                      <a
                        className="button"
                        onClick={() => {
                          refetch()
                        }}
                      >
                        Refetch
                      </a>
                    </div>
                    <div className="actions">
                      <input
                        placeholder="user id"
                        value={id}
                        onChange={({ target: { value } }) => {
                          if (data[value]) {
                            setId(value)

                            const { name, email } = data[value]

                            setName(name)
                            setEmail(email)
                          } else if (value === '') {
                            setId(value)
                          } else {
                            alert('The user does not exists!')
                          }
                        }}
                      />
                      <input
                        placeholder="name"
                        value={name}
                        onChange={({ target: { value } }) => setName(value)}
                      />
                      <input
                        placeholder="email"
                        value={email}
                        onChange={({ target: { value } }) => setEmail(value)}
                      />
                      <a
                        className="button"
                        onClick={() => {
                          update({
                            body: {
                              email,
                              name,
                            },
                            endpoint: 'users/{{id}}',
                            method: 'PUT',
                            variables: {
                              id,
                            },
                          })
                        }}
                      >
                        {isMutating ? 'Updating ...' : 'API update user'}
                      </a>
                      <a
                        className="button"
                        onClick={() => {
                          const newData = data.map((item: any) =>
                            String(item.id) === String(id)
                              ? {
                                  email,
                                  name,
                                }
                              : item,
                          )
                          console.log('id', id)
                          console.log('data', data)
                          console.log('newData', newData)
                          setData(newData)
                        }}
                      >
                        Local state update
                      </a>
                    </div>
                    <ReactTable
                      manual
                      minRows={0}
                      pageSize={1}
                      data={data}
                      columns={columns}
                      showPagination={false}
                    />
                  </>
                )}
              </Mutation>
            )
          }}
        </Query>
      </NetworkQueryProvider>
    </div>
  )
}

export default App
