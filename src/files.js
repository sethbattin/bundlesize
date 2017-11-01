const fs = require('fs')
const bytes = require('bytes')
const glob = require('glob')
const gzip = require('gzip-size')
const config = require('./config')
const debug = require('./debug')

const pathName = (path, name) => {
  return path // TODO: process name
}

const files = (input = config.files, name = config.name) => {
  const files = input.reduce((all, file) => {
    const paths = glob.sync(file.path).map(expand => {
      const size = gzip.sync(fs.readFileSync(expand, 'utf8'))
      const name = pathName(expand, file.name || name)
      const maxSize = bytes(file.maxSize) || Infinity
      return { path: expand, name, size, maxSize }
    })
    return all.concat(paths)
  }, [])

  return files
}

debug('files', files)

module.exports = files
