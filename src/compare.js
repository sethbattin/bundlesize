const { baseBranch } = require('./config')
const bytes = require('bytes')

module.exports.default = (files, masterValues = {}) => {
  const results = files.map(file => {
    const { path, size, maxSize } = file
    const master = masterValues[path]
    const value = `${path}: ${bytes(size)} gzip`
    let message = ''

    const result = {
      maxSize,
      path,
      size,
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
module.exports.STATUS = STATUS
