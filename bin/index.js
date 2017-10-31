#!/usr/bin/env node

const { inspect } = require('util')
const files = require('../src/files')
const reporter = require('../src/reporter')
const build = require('../src/build')
const input = require('../src/input')
const api = require('../src/api')

input.parse(process.argv)
if (api.enabled) {
  api.get().then(masterValues => reporter(files, masterValues))
} else {
  reporter(files)
}

process.on('unhandledRejection', function (reason) {
  console.log('Unhandled Promise')
  console.log(inspect(reason))
  build.error()
})
