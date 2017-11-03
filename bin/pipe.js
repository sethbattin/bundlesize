#!/usr/bin/env node
const { inspect } = require('util')
const program = require('commander')
const { reporter } = require('../src/reporter')
const gzip = require('gzip-size')
const bytes = require('bytes')
const readStream = require('../src/readStream')
const { error } = require('prettycli')
const build = require('../src/build')
const debug = require('../src/debug')

if (process.stdin.isTTY) {
  error('bundle-report-pipe executable is meant for usage with piped data.')
}

program
  .option('-n, --name [name]', 'custom name for a file (lib.min.js)')
  .option('-s, --max-size [maxSize]', 'maximum size threshold (3Kb)')
  .option('--debug', 'run in debug mode')
  .parse(process.argv)

const config = {
  name: program.name || require('read-pkg-up').sync().pkg.name,
  maxSize: program.maxSize
}

debug('config', config)

process.stdin.setEncoding('utf8')
readStream(process.stdin).then(data => {
  const size = gzip.sync(data)
  const maxSize = bytes(config.maxSize) || Infinity
  const file = {
    path: config.name,
    maxSize,
    size,
    name: config.name
  }
  debug('file', file)
  reporter([file])
})

process.on('unhandledRejection', reason => {
  console.log('Unhandled Promise')
  console.log(inspect(reason))
  build.error()
})
