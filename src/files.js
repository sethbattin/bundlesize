const fs = require('fs')
const bytes = require('bytes')
const glob = require('glob')
const gzip = require('gzip-size')
const config = require('./config')
const debug = require('./debug')

const getReplacer = opts => {
  if (opts && opts.pattern && opts.replacement) {
    const pattern =
      Array.isArray(opts.pattern) && opts.pattern.length
        ? new RegExp(opts.pattern[0], opts.pattern[1] || '')
        : opts.pattern

    return [pattern, opts.replacement]
  }
}

const pathName = (path, name, i, replacement) => {
  if (replacement) {
    return path.replace(replacement[0], replacement[1])
  } else if (name) {
    const suffix = i > 0 ? `_${i}` : ''
    return `${name}${suffix}`
  }
  return path
}

const files = (input = config.files, replace = config.replace) => {
  const files = input.reduce((all, file) => {
    const paths = glob.sync(file.path).map((expand, i) => {
      const size = gzip.sync(fs.readFileSync(expand, 'utf8'))
      const replacement = getReplacer(file.replace || replace)
      const name = pathName(expand, file.name, i, replacement)
      const maxSize = bytes(file.maxSize) || Infinity
      return { path: expand, name, size, maxSize }
    })
    return all.concat(paths)
  }, [])

  return files
}

debug('files', files)

module.exports = files
