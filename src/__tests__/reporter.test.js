const bytes = require('bytes')
const STATUS = require('../reporter').STATUS

jest.mock('../shortener', () => {
  return {
    shorten: url => {
      return new Promise((resolve, reject) => {
        process.nextTick(() => {
          resolve({ data: { id: url } })
        })
      })
    }
  }
})

describe('reporter.js', () => {
  let apiMock
  let cienvMock
  let buildMock
  let prettyCliMock
  const configMock = {
    baseBranch: 'master'
  }
  const files = [
    { maxSize: bytes('20kb'), path: './foo.js', size: 20000, name: 'foo' },
    { maxSize: bytes('10kb'), path: './bar.js', size: 10000, name: 'bar' }
  ]
  beforeEach(() => {
    apiMock = {
      get: jest.fn(),
      set: jest.fn(),
      enabled: false
    }
    buildMock = {
      pass: jest.fn(),
      start: jest.fn(),
      fail: jest.fn(),
      error: jest.fn()
    }
    cienvMock = {
      event: 'push',
      repo: 'reposrus/repo',
      branch: 'master',
      commit_message: 'test untestable code',
      sha: '0123456789abcdef'
    }
    prettyCliMock = {
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn()
    }
    jest.resetModules()
    jest.doMock('prettycli', () => prettyCliMock)
    jest.doMock('../api', () => apiMock)
    jest.doMock('../build', () => buildMock)
    jest.doMock('ci-env', () => cienvMock)
    jest.doMock('../config', () => configMock)
  })
  describe('compare files to settings', () => {
    let compare
    beforeEach(() => {
      compare = require('../reporter').compare
    })
    it('adds a message and a status', () => {
      const files = [{ path: 'a.js', name: 'a', maxSize: 1024, size: 1023 }]
      const results = compare(files)
      expect(results).toHaveLength(1)
      expect(results[0]).toEqual({
        path: 'a.js',
        name: 'a',
        maxSize: 1024,
        size: 1023,
        message: 'a.js: 1023B gzip < max size 1KB',
        status: STATUS.PASS
      })
    })
    it('adds a FAIL status for exceeding maxSize', () => {
      const files = [{ path: 'a.js', name: 'a', maxSize: 1023, size: 1024 }]
      const results = compare(files)
      expect(results[0]).toMatchObject({
        message: 'a.js: 1KB gzip > max size 1023B',
        status: STATUS.FAIL
      })
    })
    it('adds a WARN status for exceeding base branch size', () => {
      const files = [{ path: 'a.js', name: 'a', maxSize: 1024, size: 1023 }]
      const baseBranch = { a: 1022 }
      const results = compare(files, baseBranch)
      expect(results[0]).toMatchObject({
        message: `a.js: 1023B gzip, 1B larger than ${configMock.baseBranch}, careful!`,
        status: STATUS.WARN
      })
    })
  })

  describe('cli output', () => {
    let cliReporter
    beforeEach(() => {
      cliReporter = require('../reporter').cliReporter
    })
    it('calls info for PASS status', () => {
      cliReporter([{ status: STATUS.PASS, message: 'passs' }])
      expect(prettyCliMock.info).toHaveBeenCalledWith(STATUS.PASS, 'passs')
    })
    it('calls warn for a WARN status', () => {
      cliReporter([{ status: STATUS.WARN, message: 'warrn' }])
      expect(prettyCliMock.warn).toHaveBeenCalledWith('warrn')
    })
    it('calls error for a FAIL status', () => {
      cliReporter([{ status: STATUS.FAIL, message: 'FALE' }])
      expect(prettyCliMock.error).toHaveBeenCalledWith('FALE')
    })
  })

  describe('github status API reporter', () => {
    let statusReporter
    const pass1 = {
      path: 'a.js',
      name: 'a',
      size: 123,
      maxSize: 124,
      status: STATUS.PASS,
      message: 'pass1'
    }
    const pass2 = {
      path: 'b.js',
      name: 'b',
      size: 223,
      maxSize: 224,
      status: STATUS.PASS,
      message: 'pass2'
    }
    const fail1 = {
      path: 'c.js',
      name: 'c',
      size: 323,
      maxSize: 322,
      status: STATUS.FAIL,
      message: 'fail1'
    }
    beforeEach(() => {
      statusReporter = require('../reporter').statusReporter
    })
    it('calls build.pass for all passing entries', () => {
      statusReporter([pass1, pass2])
      expect(
        buildMock.pass
      ).toHaveBeenCalledWith('Good job! bundle size < maxSize', [
        { maxSize: 124, size: 123, path: 'a' },
        { maxSize: 224, size: 223, path: 'b' }
      ])
    })
    it('calls build.fail for any failing entry', () => {
      statusReporter([pass1, fail1])
      expect(buildMock.fail).toHaveBeenCalledWith('bundle size > maxSize', [
        { maxSize: 124, size: 123, path: 'a' },
        { maxSize: 322, size: 323, path: 'c' }
      ])
    })
  })

  describe('api (Server store) reporter', () => {
    let apiReporter
    beforeEach(() => {
      apiReporter = require('../reporter').apiReporter
    })
    it('calls api.set on the base branch', () => {
      apiReporter(files)
      expect(apiMock.set).toHaveBeenCalledWith(
        files.map(f => ({ size: f.size, path: f.name }))
      )
    })
    it('does not call set on another branch', () => {
      cienvMock.branch = 'other'
      apiReporter(files)
      expect(apiMock.set).toHaveBeenCalledTimes(0)
    })
    it('does not call set on failure', () => {
      const { reporter } = require('../reporter')
      reporter([
        { maxSize: '10kb', path: 'fail.js', size: '20kb', name: 'fail' }
      ])
      expect(apiMock.set).toHaveBeenCalledTimes(0)
    })
  })
})
