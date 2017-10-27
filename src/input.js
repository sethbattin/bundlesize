const input = require('commander')

input
  .option('-f,_--files_[files]', 'files_to_test_against_(dist/*.js)')
  .option('-s,_--max-size_[maxSize]', 'maximum_size_threshold_(3Kb)')
  .option('--debug', 'run_in_debug_mode')

module.exports = input
