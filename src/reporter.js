const { error, warn, info } = require('prettycli')
const ciEnv = require('ci-env')
const build = require('./build')
const api = require('./api')
const { baseBranch } = require('./config')
const bytes = require('bytes')

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
    const values = compared.map(file => ({ path: file.name, size: file.size }))
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
  const urlFiles = compared.map(f => {
    const { message, status, name, maxSize, size, path } = f // eslint-disable-line no-unused-vars
    return { maxSize, size, path: name }
  })
  // debug('url before shortening', url)
  if (failed(compared)) {
    build.fail(message, urlFiles)
  } else {
    build.pass(message, urlFiles)
  }
}

const compare = (files, masterValues = {}) => {
  const results = files.map(file => {
    const { path, size, maxSize, name } = file
    const master = masterValues[path]
    const value = `${path}: ${bytes(size)} gzip`
    let message = ''

    const result = {
      maxSize,
      path,
      size,
      name,
      status: STATUS.PASS
    }

    if (size > maxSize) {
      result.status = STATUS.FAIL
      message = `> max size ${bytes(maxSize)}`
    } else if (size === maxSize) {
      message = `, equals expected limit ${bytes(maxSize)}.`
    } else if (!master) {
      message = `< max size ${bytes(maxSize)}`
    } else if (size < master) {
      message = `, ${bytes(
        master - size
      )} smaller than ${baseBranch}, good job!`
    } else if (size > master) {
      result.status = STATUS.WARN
      message = `, ${bytes(size - master)} larger than ${baseBranch}, careful!`
    } else {
      message = `, unchanged from ${baseBranch}.`
    }
    result.message = `${value}${message}`
    if (master) {
      result.master = master
    }
    return result
  })
  return results
}

const STATUS = {
  PASS: 'PASS',
  FAIL: 'FAIL',
  WARN: 'WARN'
}

const failed = compared => compared.some(v => v.status === STATUS.FAIL)

const reporter = (files, masterValues = {}) => {
  const compared = compare(files, masterValues)

  cliReporter(compared)

  apiReporter(compared)

  statusReporter(compared)

  return compared
}

module.exports = {
  default: compare,
  reporter,
  compare,
  STATUS
}
