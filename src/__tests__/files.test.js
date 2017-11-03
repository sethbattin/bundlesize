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
    it('uses config.replace as the second argument', () => {
      // trust me?
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
      expect(results[0]).toMatchObject({ path: 'a-0.js' })
      expect(results[1]).toMatchObject({ path: 'a-1.js' })
    })
    describe('name property', () => {
      it('passes through a string name on a single path', () => {
        const results = filesGlobsResults([{ path: 'a.js', name: 'b' }])
        expect(results[0]).toMatchObject({ path: 'a.js', name: 'b' })
      })
      it('expands a string name with a numeral for expanded paths', () => {
        const results = filesGlobsResults(
          [{ path: 'a*.js', name: 'path' }],
          [['a1.js', 'a2.js']]
        )
        expect(results[0]).toMatchObject({ path: 'a1.js', name: 'path' })
        expect(results[1]).toMatchObject({ path: 'a2.js', name: 'path_1' })
      })
    })
    describe('replace property', () => {
      const replacer = (pattern, replacement) => {
        const file = {
          path: 'long-file-name.js',
          replace: {
            pattern,
            replacement
          }
        }
        return file
      }
      it('creates a name from the path using a string.replace object', () => {
        const file = replacer('long-file', 'short')
        const results = filesGlobsResults([file])
        expect(results[0]).toMatchObject({
          path: 'long-file-name.js',
          name: 'short-name.js'
        })
      })
      it('it accepts RegExps and replacement patterns', () => {
        const file1 = replacer(/(.*)-file-name/, '$1')
        const file2 = replacer(/(.*)-file-name/, '$1')
        file2.path = 'ugly-file-name.js'
        const results = filesGlobsResults([file1, file2])
        expect(results[0]).toHaveProperty('name', 'long.js')
        expect(results[1]).toHaveProperty('name', 'ugly.js')
      })
      it('it accepts RegExps and replacement functions', () => {
        const file = replacer(
          /(.*)-file-name/,
          (match, group1, offset) => `${group1}_${match}_${offset}`
        )
        const results = filesGlobsResults([file])
        expect(results[0]).toHaveProperty('name', 'long_long-file-name_0.js')
      })
      it('it converts glob results', () => {
        const file = replacer(/(.*)-file-name/, '$1')
        const glob = ['big-file-name.js', 'red-file-name.js']
        const results = filesGlobsResults([file], [glob])
        expect(results[0]).toHaveProperty('name', 'big.js')
        expect(results[1]).toHaveProperty('name', 'red.js')
      })
      it('supercedes a name property', () => {
        const file = replacer('file-name', '')
        file.name = 'ignored'
        const results = filesGlobsResults([file])
        expect(results[0]).toHaveProperty('name', 'long-.js')
      })
      it('uses a single pattern argument for all paths', () => {
        const files = [
          { path: 'a.js', maxSize: '13B' },
          { path: 'b*.js', maxSize: '13B' }
        ]
        globMock.mockReturnValueOnce(['aF.js'])
        globMock.mockReturnValueOnce(['bGF.js', 'bHF.js'])
        const replace = {
          pattern: 'F.js',
          replacement: ''
        }
        const results = require('../files')(files, replace)
        expect(results).toHaveLength(3)
        expect(results[0]).toHaveProperty('name', 'a')
        expect(results[1]).toHaveProperty('name', 'bG')
        expect(results[2]).toHaveProperty('name', 'bH')
      })
    })
  })
})
