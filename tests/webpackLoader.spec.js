'use strict';

require('jasmine-pit').install(global);

var Promise = require('bluebird');

var fs = require('fs');
var invariant = require('invariant');
var path = require('path');
var jsdom = Promise.promisifyAll(require('node-jsdom'));
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
          {test: /\.js$/, loader: 'jsx-loader?harmony!' + path.join(__dirname, '..', 'lib', 'webpackLoader.js')},
        ],
      },
    });

    var runAsync = Promise.promisify(compiler.run);

    return runAsync.call(compiler).then(function(stats) {
      var jsonStats = stats.toJson();
      invariant(jsonStats.errors.length === 0, stats.toString());

      return jsdom.envAsync(
        '<p><a class="the-link" href="https://github.com/tmpvar/jsdom">jsdom!</a></p>',
        []
      ).then(function(window) {
        var src = fs.readFileSync(path.join(__dirname, 'bundle.js'), {encoding: 'utf8'});
        console.log(window.eval(src));
      });
    });
  });
});
