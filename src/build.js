const Build = require('github-build')
const prettycli = require('prettycli')
const { branch, repo, commit_message, sha } = require('ci-env')
const token = require('./token')
const debug = require('./debug')
const api = require('./api')
const shortener = require('./shortener')

let start = () => {
  prettycli.warn('Cannot add github status without app token')
}
let pass = () => {} // noop
let fail = () => process.exit(1)
let error = () => process.exit(1)

const label = 'bundle-report'
const description = 'Checking output size...'
const meta = { repo, sha, token, label, description }

const build = new Build(meta)

debug('token exists', !!token)
debug('repo', repo)
debug('sha', sha)

const getUrl = (files, callback) => {
  const params = JSON.stringify({ files, repo, branch, commit_message, sha })
  const url = api.resultsUrl(params)
  shortener
    .shorten(url)
    .then(res => callback(res.data.id))
    .catch(() => callback(url))
  return url
}

if (token) {
  const handleError = err => {
    const message = `Could not add github status.
        ${err.status}: ${err.error.message}`

    prettycli.error(message, { silent: true, label: 'ERROR' })
  }

  start = () => build.start().catch(handleError)
  pass = (message, files) =>
    getUrl(files, url => build.pass(message, url).catch(handleError))
  fail = (message, files) =>
    getUrl(files, url => build.fail(message, url).catch(handleError))
  error = (message, files) =>
    getUrl(files, url => build.error(message, url).catch(handleError))
}

module.exports = { start, pass, fail, error }
