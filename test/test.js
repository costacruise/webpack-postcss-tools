#!/usr/bin/env node

var join = require('path').join;
var resolve = require('path').resolve;
var tmpdir = require('os').tmpdir;
var shelljs = require('shelljs');
var ls = shelljs.ls, mkdir = shelljs.mkdir, cp = shelljs.cp,
  cd = shelljs.cd, exec = shelljs.exec;
var Mocha = require('mocha');
var readdirSync = require('fs').readdirSync;
var webpack = require('webpack');
var testConfig = require('./webpack.config.js');

function unitTests(callback) {
  var compiler = webpack(testConfig);

  compiler.run(function(err) {
    if (err)
      throw new Error(err);

    var mocha = new Mocha();

    readdirSync('test/test-build').forEach(function(file) {
      mocha.addFile(join('test/test-build', file));
    });

    mocha.run(function(failures){
      callback(failures);
    });
  });
}

function buildExamples() {
  var tmp = join(tmpdir(), 'webpack-postcss-tools.' + process.pid);
  var base = process.cwd();
  var testDirs = [];

  mkdir(tmp);

  ls('examples').forEach(function(d) {
    var dir = join(tmp, d);

    testDirs.push(dir);
    cp('-r', join('examples', d), tmp);
    cd(dir);

    console.log('building example', d);

    if (exec('npm cache clean webpack-postcss-tools').code !== 0)
      throw new Error('`npm cache clean webpack-postcss-tools` failed in', dir);

    if (exec('npm install ' + resolve(base)).code !== 0)
      throw new Error('`npm install ' + resolve(base) + '` failed in', dir);

    if (exec('npm install').code !== 0)
      throw new Error('`npm install` failed in', dir);

    if (exec('npm run build').code !== 0)
      throw new Error('`npm run build` failed in', dir);

    cd(base);
  });

  console.log('successfully built tests:\n' + testDirs.join('\n'));
  console.log('you can manually test these by running `npm run dev` in the ' +
              'above directories and ensuring that when you load the page, ' +
              'no exceptions are thrown');
}

unitTests(function(failures) {
  if (failures)
    throw new Error('failed ' + failures + ' unit test(s)');

  buildExamples();
});
