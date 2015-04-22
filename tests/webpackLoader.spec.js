'use strict';

require('jasmine-pit').install(global);

var Promise = require('bluebird');

var fs = require('fs');
var path = require('path');
var webpack = require('webpack');

describe('webpackLoader', function() {
  pit('works', function() {
    // returns a Compiler instance
    var compiler = webpack({
      entry: path.join(__dirname, 'example.js'),
      output: {
        filename: path.join(__dirname, 'bundle.js'),
      },
      module: {
        loaders: [
          {test: /\.js$/, loader: 'jsx-loader?harmony'},
        ],
      },
    });

    var runAsync = Promise.promisify(compiler.run);

    return runAsync.call(compiler).then(function(stats) {
      console.log(stats.toString());
      var bundleSrc = fs.readFileSync(path.join(__dirname, 'bundle.js'), {encoding: 'utf8'});

      //expect(bundleSrc).toBe('bla');
    });
  });
});
