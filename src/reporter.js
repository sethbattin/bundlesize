const { error, warn, info } = require('prettycli')
const { event, repo, branch, commit_message, sha } = require('ci-env')
const build = require('./build')
const api = require('./api')
const debug = require('./debug')
const shortener = require('./shortener')
const { baseBranch } = require('./config')
const compare = require('./compare').default
const STATUS = require('./compare').STATUS

const setBuildStatus = ({
  url,
  files,
  globalMessage,
  fail,
  event: currentEvent,
  branch: currentBranch
}) => {
  if (fail) build.fail(globalMessage || 'bundle size > maxSize', url)
  else {
    if (currentEvent === 'push' && currentBranch === baseBranch) {
      const values = []
      files.map(file => values.push({ path: file.path, size: file.size }))
      api.set(values)
    }
    build.pass(globalMessage || 'Good job! bundle size < maxSize', url)
  }

  debug('global message', globalMessage)
}

const reporter = (files, masterValues = {}) => {
  let fail = false
  let globalMessage

  const compared = compare(files, masterValues)
  compared.map(file => {
    switch (file.status) {
      case STATUS.FAIL:
        fail = true
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
  if (compared.length === 1) {
    globalMessage = compared[0].message
  }
  /* prepare the build page */
  const uriFiles = compared.map(f => {
    const { message, status, ...rest } = f
    return rest
  })
  const params = encodeURIComponent(
    JSON.stringify({ files: uriFiles, repo, branch, commit_message, sha })
  )
  let url = `https://bundlesize-store.now.sh/build?info=${params}`

  debug('url before shortening', url)

  return shortener
    .shorten(url)
    .then(res => {
      url = res.data.id
      debug('url after shortening', url)
      setBuildStatus({
        url,
        files: compared,
        globalMessage,
        fail,
        event,
        branch
      })
    })
    .catch(err => {
      debug('err while shortening', err)
      setBuildStatus({
        url,
        files: compared,
        globalMessage,
        fail,
        event,
        branch
      })
    })
}

module.exports = reporter
