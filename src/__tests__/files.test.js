const FILE_SIZE = 42
jest.doMock('gzip-size', () => ({
  sync: () => FILE_SIZE
}))
jest.mock('prettycli', () => ({
  error: e => {
    throw e
  }
}))
jest.mock('fs', () => {
  const _fs = require.requireActual('fs')
  const readFileSync = () => 'var a = "file content"'
  return Object.assign({}, _fs, { readFileSync })
})
let globMock = null

const mockFileArray = jest.fn()
jest.mock('../config', () => ({
  files: { reduce: mockFileArray, name: 'unused' }
}))

describe('files.js', () => {
  beforeEach(() => {
    jest.resetModules()
    globMock = jest.fn()
    jest.doMock('glob', () => ({ sync: globMock }))
  })

  it('uses config for default arguments', () => {
    require('../files')()
    expect(mockFileArray).toBeCalled()
  })

  it('returns files from input with size added', () => {
    const file = { maxSize: '11B', path: 'a.js' }
    globMock.mockReturnValueOnce(['a.js'])
    const results = require('../files')([file])
    expect(results).toHaveLength(1)
    expect(results[0]).toEqual({ maxSize: 11, path: 'a.js', size: FILE_SIZE })
  })
  it('expands glob patterns', () => {
    const file = { maxSize: '13B', path: 'a-*.js' }
    globMock.mockReturnValueOnce(['a-0.js', 'a-1.js'])
    const results = require('../files')([file])
    expect(results).toHaveLength(2)
    expect(results).toEqual(
      expect.arrayContaining([
        { maxSize: 13, path: 'a-0.js', size: FILE_SIZE },
        { maxSize: 13, path: 'a-1.js', size: FILE_SIZE }
      ])
    )
  })
})
