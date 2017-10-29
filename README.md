<p align="center">
  <img src="https://cdn.rawgit.com/sethbattin/bundlesize/master/art/logo.png" height="200px">
  <br><br>
  <b>Keep your bundle size in check</b>
  <br>
</p>

&nbsp;

[![Build Status](https://travis-ci.org/sethbattin/bundlesize.svg?branch=parallel-dev)](https://travis-ci.org/sethbattin/bundlesize)

#### minimal setup

```sh
npm install bundlereport --save-dev
```

&nbsp;

#### usage

Add it to your scripts in `package.json`

```json
"scripts": {
  "test": "bundlereport"
}
```

&nbsp;

Or you can use `npx` with [NPM 5.2+](https://medium.com/@maybekatz/introducing-npx-an-npm-package-runner-55f7d4bd282b).

```sh
npx bundlereport
```

#### configuration

&nbsp;

#### 1) Add the path and gzip maxSize in your `package.json`

```json
{
  "name": "your cool library",
  "version": "1.1.2",
  "bundlereport": {
    "files": [
      {
        "path": "./dist.js",
       "maxSize": "3 kB"
      } 
    ]
  }
}
```

`bundlereport` also supports [glob patterns](https://github.com/isaacs/node-glob)

Example:

```json
{
  "bundlereport": [
    "files": [
      {
        "path": "./dist/vendor-*.js",
        "maxSize": "3 kB"
      },
      {
        "path": "./dist/chunk-*.js",
        "maxSize": "3 kB"
      }
    ]
  }
}
```

This makes it great for using with applications that are bundled with another tool. It will match multiple files if necessary and create a new row for each file.

&nbsp;

#### 2) build status

![build status](https://cdn.rawgit.com/sethbattin/bundlesize/master/art/status.png)

Bundle report uses the storage server of its fork source, [bundlesize](https://github.com/siddharthkp/bundlesize/).  (Old references still exist.)  buildsize hosts a server store that both 1.) uses the [Github Status API](https://developer.github.com/v3/repos/statuses/) to mark commits and PRs, and 2.) saves the results from the previous build, if that build is "master".  bundlereport allows this storage to apply to any branch name via the `baseBranch` config option.  The ability to check against any merge target is on the TODO list.

To use the size comparison (via `bundlesize`):
- [Authorize `bundlesize` for status access](https://github.com/login/oauth/authorize?scope=repo%3Astatus&client_id=6756cb03a8d6528aca5a), copy the token provided.
- Add this token as `BUNDLESIZE_GITHUB_TOKEN` as environment parameter in your CIs project settings.

Currently works for [Travis CI](https://travis-ci.org), [CircleCI](https://circleci.com/), [Wercker](http://www.wercker.com), and [Drone](http://readme.drone.io/).

&nbsp;

#### CLI

example usage:

```sh
bundlereport -f "dist/*.js" -s 20kB
```

For more granular configuration, we recommend configuring it in the `package.json` (documented above).

#### TODO

- Work with other CI tools ([AppVeyor](https://www.appveyor.com/), etc.)
- Automate setup (setting env_var)

&nbsp;

#### similar projects

- [bundlesize](https://github.com/siddharthkp/bundlesize/) - This repo's fork source
- [BuildSize](https://buildsize.org/) - GitHub App, no manual configuration required
- [travis-weigh-in](https://github.com/danvk/travis-weigh-in) - Uses Python rather than Node.js
- [size-limit](https://github.com/ai/size-limit) - Uses webpack, builds your files for you.

#### license

MIT © [sethbattin](https://github.com/sethbattin)

