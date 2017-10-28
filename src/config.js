const readPkgUp = require('read-pkg-up')

const pkg = readPkgUp.sync().pkg
/* Config from CLI */
const program = require('./input')
const { error } = require('prettycli')
const debug = require('./debug')

/* Config from package.json */
const packageJSONconfig = pkg.bundlereport

let cliConfig

if (program.files) {
  cliConfig = [
    {
      path: program.files,
      maxSize: program.maxSize
    }
  ]
}

/* Send to readme if no configuration is provided */

if (!packageJSONconfig && !cliConfig) {
  error(
    `Config not found.

    You can read about the configuration options here:
    https://github.com/sethbattin/bundlesize#configuration
  `,
    { silent: true }
  )
}

const defaultConfig = {
  files: [],
  baseBranch: 'master'
}
let config
if (cliConfig) {
  config = {
    files: cliConfig
  }
} else if (Array.isArray(packageJSONconfig)) {
  config = Object.assign({}, defaultConfig, { files: packageJSONconfig })
} else {
  config = Object.assign({}, defaultConfig, packageJSONconfig || {})
}

debug('cli config', cliConfig)
debug('package json config', packageJSONconfig)
debug('selected config', config)

module.exports = config
