import { buildUrl } from './utils'

describe('buildUrl', () => {
  it('should return the endpoint first if it is a valid url', () => {
    expect(buildUrl('http://localhost', 'http://localhost.url')).toEqual(
      'http://localhost',
    )
    expect(buildUrl('http://domain.dev', 'http://domain.url')).toEqual(
      'http://domain.dev',
    )
    expect(buildUrl('http://domain.dev')).toEqual('http://domain.dev')
  })

  it('should build the url is baseUrl as base', () => {
    expect(buildUrl('/endpoint', 'http://localhost')).toEqual(
      'http://localhost/endpoint',
    )
    expect(buildUrl('/endpoint', 'http://domain.dev')).toEqual(
      'http://domain.dev/endpoint',
    )
    expect(buildUrl('/endpoint', 'http://domain.dev/')).toEqual(
      'http://domain.dev/endpoint',
    )
    expect(buildUrl('endpoint', 'http://domain.dev')).toEqual(
      'http://domain.dev/endpoint',
    )
  })

  it('should throw an error if neither baseUrl nor endpoint are valid urls', () => {
    expect(() => buildUrl('/test', 'test')).toThrow()
    expect(() => buildUrl('/test')).toThrow()
  })
})
