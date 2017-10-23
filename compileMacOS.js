const { compile } = require('nexe')

compile({
  input: './index.js',
  output: './dist/photoLocationRenamer',
  target: 'mac-x64-8.7.0'
})