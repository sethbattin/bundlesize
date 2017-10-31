const bytes = require('bytes')
jest.mock('prettycli', () => ({
  error: () => {},
  warn: () => {},
  info: () => {}
}))

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
  const buildMock = {
    pass: jest.fn(),
    start: jest.fn(),
    fail: jest.fn(),
    error: jest.fn()
  }
  const configMock = {
    baseBranch: 'master'
  }
  const files = [
    { maxSize: bytes('20kb'), path: './foo.js', size: 20000 },
    { maxSize: bytes('10kb'), path: './bar.js', size: 10000 }
  ]
  beforeEach(() => {
    apiMock = {
      get: jest.fn(),
      set: jest.fn(),
      enabled: false
    }
    cienvMock = {
      event: 'push',
      repo: 'reposrus/repo',
      branch: 'master',
      commit_message: 'test untestable code',
      sha: '0123456789abcdef'
    }
    jest.resetModules()
    jest.doMock('../api', () => apiMock)
    jest.doMock('../build', () => buildMock)
    jest.doMock('ci-env', () => cienvMock)
    jest.doMock('../config', () => configMock)
  })
  describe('when api values are not available', () => {
    // apiMock.enabled is correct
    describe('on success', () => {
      it('calls build.pass with base branch', () => {
        const reporter = require('../reporter')
        expect.assertions(2)
        reporter(files)
        Promise.resolve().then(() => {
          expect(buildMock.pass).toHaveBeenCalledWith(
            'Good job! bundle size < maxSize',
            files.map(f => ({
              maxSize: f.maxSize,
              path: f.path,
              size: f.size
            }))
          )
        })
        expect(apiMock.set).toHaveBeenCalledWith(
          files.map(f => ({ size: f.size, path: f.path }))
        )
      })
      it('does not call api when not on the base branch', () => {
        cienvMock.branch = 'other'
        const reporter = require('../reporter')
        expect.assertions(1)
        reporter(files)
        Promise.resolve().then(() => {
          expect(apiMock.set.mock.calls.length).toBe(0)
        })
      })
    })
    describe('on failure', () => {
      it('calls build.fail', () => {
        const reporter = require('../reporter')
        expect.assertions(1)
        reporter([{ maxSize: '10kb', path: 'fail.js', size: '20kb' }])
        Promise.resolve().then(() => {
          expect(buildMock.fail).toHaveBeenCalledTimes(1)
        })
      })
    })
  })
  describe('when api has values', () => {
    let masterValues
    beforeEach(() => {
      masterValues = files.reduce((all, f) => {
        all[f.path] = f.size
        return all
      }, {})
    })
    it('returns results with master values', () => {
      const reporter = require('../reporter')
      expect.assertions(2)
      const report = Promise.resolve(reporter(files, masterValues)).then(() => {
        expect(buildMock.pass).toHaveBeenCalledWith(
          'Good job! bundle size < maxSize',
          files.map(f => ({
            maxSize: f.maxSize,
            path: f.path,
            size: f.size,
            master: masterValues[f.path]
          }))
        )
      })
      expect(apiMock.set).toHaveBeenCalledWith(
        files.map(f => ({ size: f.size, path: f.path }))
      )
      return report
    })
  })
})
