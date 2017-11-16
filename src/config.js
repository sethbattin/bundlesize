const { pkg, path: projPath } = require('read-pkg-up').sync()
const { dirname, join } = require('path')
const { readFileSync } = require('fs')
const jsYaml = require('js-yaml')
/* Config from CLI */
const program = require('./input')
const debug = require('./debug')

/* Config from package.json */
const packageJSONconfig = pkg.bundleReport

const readConfigFile = path => {
  try {
    return require(path)
  } catch (e) {}

  try {
    const content = readFileSync(path)
    return jsYaml.safeLoad(content)
  } catch (e) {}

  return {}
}

let cliConfig = {}

if (program.files) {
  cliConfig.files = [
    {
      path: program.files,
      maxSize: program.maxSize
    }
  ]
}

let config
let configFile

const loadOrThrow = path => {
  const file = readConfigFile(path)
  if (!Object.keys(file).length) {
    const err = `could not read config file: '${path}'`
    throw err
  }
  return file
}

if (program.config) {
  configFile = loadOrThrow(program.config)
} else if (typeof packageJSONconfig === 'string') {
  configFile = loadOrThrow(packageJSONconfig)
} else if (packageJSONconfig && packageJSONconfig.config) {
  configFile = loadOrThrow(packageJSONconfig.config)
} else {
  configFile = readConfigFile(join(dirname(projPath), '.bundlereport.rc'))
}

const defaultConfig = readConfigFile(join(__dirname, 'default.bundlereport.rc'))

if (Array.isArray(packageJSONconfig)) {
  config = Object.assign(
    {},
    defaultConfig,
    { files: packageJSONconfig },
    configFile,
    cliConfig
  )
} else {
  const pdj = typeof packageJSONconfig === 'string' ? {} : packageJSONconfig
  config = Object.assign({}, defaultConfig, pdj || {}, configFile, cliConfig)
}

debug('cli config', cliConfig)
debug('package json config', packageJSONconfig)
debug('config file', configFile)
debug('selected config', config)

module.exports = config
