const dirname = require('path').dirname
describe('config.js', () => {
  let mockCommander
  let mockPDJ
  beforeEach(() => {
    jest.resetModules()
    mockCommander = {
      option: () => mockCommander,
      parse: () => {},
      files: 'cli.js',
      maxSize: '30KB',
      config: null
    }
    mockPDJ = {
      bundleReport: [{ path: 'index.js', maxSize: '750B' }]
    }
    jest.doMock('read-pkg-up', () => {
      return {
        sync: () => ({ pkg: mockPDJ, path: dirname(dirname(__dirname)) })
      }
    })
  })
  it('has a files property', () => {
    const config = require('../config')
    expect(config.files).toBeDefined()
  })
  it('reads and uses cli options first', () => {
    jest.doMock('commander', () => mockCommander)
    const config = require('../config')
    expect(config.files).toMatchObject([
      {
        path: 'cli.js',
        maxSize: '30KB'
      }
    ])
  })
  describe('when cli options are absent', () => {
    beforeEach(() => {
      mockCommander.files = null
    })
    it('uses package.json setting for "bundleReport"', () => {
      jest.doMock('commander', () => mockCommander)
      const config = require('../config')
      expect(config.files).toMatchObject(mockPDJ.bundleReport)
    })
    it('permits key-value config in package.json', () => {
      jest.doMock('commander', () => mockCommander)
      const files = [{ path: 'new.js', maxSize: '50MB' }]
      mockPDJ.bundleReport = {
        files: files,
        other: 'something new'
      }
      const config = require('../config')
      expect(config.files).toMatchObject(files)
    })
  })
  describe('loads a config file', () => {
    let readMock
    beforeEach(() => {
      readMock = jest.fn()
      mockCommander.files = null
      jest.doMock('fs', () => ({
        readFileSync: readMock
      }))
    })
    it('accepts a cli argument', () => {
      mockCommander.config = 'config.file'
      readMock.mockReturnValueOnce('{}')
      require('../config')
      expect(readMock).toBeCalledWith('config.file')
    })
    it('accepts a string setting in package.json', () => {
      mockPDJ.bundleReport = 'config.phial'
      readMock.mockReturnValueOnce('{}')
      require('../config')
      expect(readMock).toBeCalledWith('config.phial')
    })
    it('parses yml', () => {
      mockPDJ.bundleReport = 'config.yaml'
      readMock.mockReturnValueOnce(`
baseBranch: ymldevelop
files:
  - name: a.js
    path: src/build/a.js
  - name: b.js
    path: src/b.js
`)
      const config = require('../config')
      expect(config.baseBranch).toEqual('ymldevelop')
      expect(config.files).toEqual([
        { name: 'a.js', path: 'src/build/a.js' },
        { name: 'b.js', path: 'src/b.js' }
      ])
    })
  })
})
