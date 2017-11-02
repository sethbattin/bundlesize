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
  files: { reduce: mockFileArray },
  name: 'unused'
}))

describe('files.js', () => {
  beforeEach(() => {
    jest.resetModules()
    globMock = jest.fn()
    jest.doMock('glob', () => ({ sync: globMock }))
  })
  describe('cli behavior', () => {
    it('uses config for default arguments', () => {
      require('../files')()
      expect(mockFileArray).toBeCalled()
    })
  })
  describe('configurability', () => {
    // set up test mocks for paths, optionally specifying glob results
    const filesGlobsResults = (files, globs) => {
      const _files = files.map((f, i) => {
        return Object.assign({}, { maxSize: '13B', path: `${i}.js` }, f)
      })
      const _globs = globs || _files.map(f => [f.path])
      _globs.forEach(g => globMock.mockReturnValueOnce(g))
      const testee = require('../files')(_files)
      return testee
    }

    it('returns files from input with size added', () => {
      const results = filesGlobsResults([{ path: 'a.js' }])
      expect(results).toHaveLength(1)
      expect(results[0]).toEqual({
        maxSize: 13,
        path: 'a.js',
        size: FILE_SIZE,
        name: 'a.js'
      })
    })
    it('expands glob patterns', () => {
      const results = filesGlobsResults(
        [{ path: 'a-*.js' }],
        [['a-0.js', 'a-1.js']]
      )
      expect(results).toHaveLength(2)
      expect(results[0]).toMatchObject({
        maxSize: 13,
        path: 'a-0.js',
        size: FILE_SIZE
      })
      expect(results[1]).toMatchObject({
        maxSize: 13,
        path: 'a-1.js',
        size: FILE_SIZE
      })
    })
    describe('name property', () => {
      it('passes through a string name on a single path', () => {})
      it('expands a string name with a numeral for expanded paths', () => {})
      it('checks for duplicate names and errors out', () => {})
    })
    describe('replace property', () => {
      it('creates a name from the path using a string.replace argument pair object', () => {
        const file = {
          path: 'long-file-name.js',
          replace: {
            pattern: 'long-file',
            replacement: 'short'
          }
        }
        const results = filesGlobsResults([file])
        expect(results[0]).toEqual({
          maxSize: 13,
          path: 'long-file-name.js',
          size: FILE_SIZE,
          name: 'short-name.js'
        })
      })
      it('it accepts Regexes and functions', () => {})
      it('it converts glob results', () => {})
    })
  })
})
