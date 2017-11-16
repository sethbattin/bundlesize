<p align="center">
  <img src="https://cdn.rawgit.com/sethbattin/bundle-report/master/art/logo.png" height="200px">
  <br><br>
  <b>Keep your bundle size in check</b>
  <br>
</p>

&nbsp;

[![Build Status](https://travis-ci.org/sethbattin/bundle-report.svg?branch=parallel-dev)](https://travis-ci.org/sethbattin/bundlesize)

#### minimal setup

```sh
npm install bundle-report --save-dev
```

&nbsp;

#### usage

Add it to your scripts in `package.json`

```json
"scripts": {
  "test": "bundle-report"
}
```

&nbsp;

Or you can use `npx` with [NPM 5.2+](https://medium.com/@maybekatz/introducing-npx-an-npm-package-runner-55f7d4bd282b).

```sh
npx bundle-report
```

#### configuration

Specify configuration through any method below.  Files may be yaml, json, or js modules, and package.json may contain an object.

1. Specify cli option `--config [file name]` to point at any config file.
2. Create a config file ".bundlereport.rc" (see the exmaple in src/default.bundlereport.rc)
3. Specify `package.json` key "bundleReport" with a string config file path.
4. Add a settings object in `package.json` under key "bundleReport".
5. Specify property "config" in the object at `package.json`

##### Basic Settings

```json
{
  "name": "your cool library",
  "version": "1.1.2",
  "bundleReport": {
    "files": [
      {
        "path": "./dist.js",
       "maxSize": "3 kB"
      } 
    ]
  }
}
```
##### globs
`bundle-report` also supports [glob patterns](https://github.com/isaacs/node-glob)

This makes it great for using with applications that are bundled with another tool. It will match multiple files if necessary and create a new row for each file.

```json
{
  "bundleReport": {
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

##### named output
Some bundle files may contain irrelevant path info, or simply be too long, or contain hashes (which prevents comparing built-to-build).  There are two ways to specify another name for the file.  For more examples, see [this project's package.json](https://github.com/sethbattin/bundle-report/blob/parallel-dev/package.json#L53-L79).

1. Each item in the `files` option may contain a `name` property.  For globs with multiple entries, this name will receive a numeral suffix

```json
{
  "bundleReport": {
    "files": [
      {"path": "webpack-with-hash*.js", "maxSize": "3KB", "name": "webpack"}
    ]
  }
}
```
2. You may specify a `replace` pattern for substring or regex replacement.  The pattern may be specified at the top level config or for each entry in 'files'.  The replacement will be applied to the path of the file (after glob expansion), and the result will become the `name` property for that file.  (`name` is superceded by `replace`)

The `replace` options requires two properties, `pattern` and `replacement`.  These properties become the first and second argument to [`String.prototype.replace`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace).  If `pattern` contains an array, then its first element and optional second element are passed as arguments to [`new RegExp`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp).  (This permits `RegExp` via package.json or yaml strings.  If you use a module as configuration [in progress](https://github.com/sethbattin/bundle-report/issues/5), then you may specify a RegExp directly, as well as a function for the `replacement` property)

This example uses a regular expression to name each file starting with `re`, and removes its path and file extension.

```json
{
  "bundleReport": {
    "files": [
      {
        "path": "./src/re*.js",
        "maxSize": "2KB",
        "replace": {
          "pattern": ["\\./src/(.*)\\.js"],
          "replacement": "$1"
        }
      }
    ]
  }
}
```

#### 2) build status

![build status](https://cdn.rawgit.com/sethbattin/bundle-report/master/art/status.png)

Bundle report uses the storage server of its fork source, [bundlesize](https://github.com/siddharthkp/bundlesize/).  (Old references still exist.)  buildsize hosts a server store that both 1.) uses the [Github Status API](https://developer.github.com/v3/repos/statuses/) to mark commits and PRs, and 2.) saves the results from the previous build, if that build is "master".  bundle-report allows this storage to apply to any branch name via the `baseBranch` config option.  The ability to check against any merge target is on the TODO list.

To use the size comparison (via `bundlesize`):
- [Authorize `bundlesize` for status access](https://github.com/login/oauth/authorize?scope=repo%3Astatus&client_id=6756cb03a8d6528aca5a), copy the token provided.
- Add this token as `BUNDLESIZE_GITHUB_TOKEN` as environment parameter in your CIs project settings.

Currently works for [Travis CI](https://travis-ci.org), [CircleCI](https://circleci.com/), [Wercker](http://www.wercker.com), and [Drone](http://readme.drone.io/).

&nbsp;

#### CLI

example usage:

```sh
bundle-report -f "dist/*.js" -s 20kB
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

