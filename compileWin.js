const { compile } = require('nexe')

compile({
  input: './index.js',
  output: './dist/photoLocationRenamer.exe',
  target: 'windows-x64-8.7.0'
})