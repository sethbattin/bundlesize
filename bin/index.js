#!/usr/bin/env node

const input = require('../src/input')
input.parse(process.argv)

const { inspect } = require('util')
const files = require('../src/files')
const { reporter } = require('../src/reporter')
const build = require('../src/build')
const api = require('../src/api')

if (api.enabled) {
  api.get().then(masterValues => reporter(files(), masterValues))
} else {
  reporter(files())
}

process.on('unhandledRejection', function (reason) {
  console.log('Unhandled Promise')
  console.log(inspect(reason))
  build.error()
})
