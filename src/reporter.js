const { error, warn, info } = require('prettycli')
const ciEnv = require('ci-env')
const { repo, commit_message, sha } = ciEnv
const build = require('./build')
const api = require('./api')
const debug = require('./debug')
const shortener = require('./shortener')
const { baseBranch } = require('./config')
const compare = require('./compare').default
const STATUS = require('./compare').STATUS

const cliReporter = compared => {
  compared.map(file => {
    switch (file.status) {
      case STATUS.FAIL:
        error(file.message)
        break
      case STATUS.WARN:
        warn(file.message)
        break
      default:
        info(STATUS.PASS, file.message)
        break
    }
  })
}

const apiReporter = compared => {
  if (
    !failed(compared) &&
    ciEnv.event === 'push' &&
    ciEnv.branch === baseBranch
  ) {
    const values = compared.map(file => ({ path: file.path, size: file.size }))
    api.set(values)
  }
}

const statusReporter = compared => {
  let message
  if (compared.length === 1) {
    message = compared[0].message
  } else if (failed(compared)) {
    message = 'bundle size > maxSize'
  } else {
    message = 'Good job! bundle size < maxSize'
  }
  /* prepare the build page */
  const uriFiles = compared.map(f => {
    const { message, status, ...rest } = f
    return rest
  })
  const params = encodeURIComponent(
    JSON.stringify({
      files: uriFiles,
      repo,
      branch: ciEnv.branch,
      commit_message,
      sha
    })
  )
  const url = `https://bundlesize-store.now.sh/build?info=${params}`
  debug('url before shortening', url)
  if (failed(compared)) {
    build.fail(message, url)
  } else {
    build.pass(message, url)
  }
}

const failed = compared => compared.some(v => v.status === STATUS.FAIL)

const reporter = (files, masterValues = {}) => {
  const compared = compare(files, masterValues)

  cliReporter(compared)

  apiReporter(compared)

  return shortener
    .shorten('temp')
    .then(res => {
      statusReporter(compared)
    })
    .catch(err => {
      debug('err while shortening', err)
      statusReporter(compared)
    })
}

module.exports = reporter
