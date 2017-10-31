jest.mock('read-pkg-up', () => {
  const mockPDJ = {
    bundleReport: [{ path: 'index.js', maxSize: '750B' }]
  }
  return {
    sync: () => ({ pkg: mockPDJ }),
    mockPDJ
  }
})

describe('config.js', () => {
  let mockCommander
  beforeEach(() => {
    jest.resetModules()
    mockCommander = {
      option: () => mockCommander,
      parse: () => {},
      files: 'cli.js',
      maxSize: '30KB'
    }
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
      const readPkgUp = require('read-pkg-up')
      const config = require('../config')
      expect(config.files).toMatchObject(readPkgUp.mockPDJ.bundleReport)
    })
    it('permits key-value config in package.json', () => {
      jest.doMock('commander', () => mockCommander)
      const readPkgUp = require('read-pkg-up')
      const files = [{ path: 'new.js', maxSize: '50MB' }]
      readPkgUp.mockPDJ.bundleReport = {
        files: files,
        other: 'something new'
      }
      const config = require('../config')
      expect(config.files).toMatchObject(files)
    })
  })
})
