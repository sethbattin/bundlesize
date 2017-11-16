const input = require('commander')

input
  .option('-f, --files [files]', 'files_to_test_against_(dist/*.js)')
  .option('-s, --max-size_[maxSize]', 'maximum_size_threshold_(3Kb)')
  .option('--debug', 'run_in_debug_mode')
  .option('-c, --config [config]', 'specify config file to load')

module.exports = input
