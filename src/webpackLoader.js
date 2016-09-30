'use strict';

var assign = require('object-assign');
var extractStyles = require('./extractStyles');
var loaderUtils = require('loader-utils');
var path = require('path');

var {defaultConfig, validateConfig} = require('./config');
var configPath = path.resolve('jsxstyle.config.js');
var config = {}
try {
  config = require(configPath);
} catch (e) {}

validateConfig(config);
var {getStylesheetId, formatClassNameFromStylesheet} = assign(defaultConfig, config);

var seenBaseNames = {};
var classNameCounters = {};

function webpackLoader(content) {
  this.cacheable && this.cacheable();
  var namespace = {};
  var query = loaderUtils.parseQuery(this.query);

  for (var key in query) {
    // TODO: use webpack resolver
    namespace[key] = require(query[key]);
  }

  var baseName = path.basename(this.resourcePath).slice(
    0,
    -1 * path.extname(this.resourcePath).length
  );

  seenBaseNames[baseName] = seenBaseNames[baseName] || 0;
  var index = seenBaseNames[baseName]++;

  if (index > 0) {
    baseName += index;
  }

  classNameCounters[baseName] = classNameCounters[baseName] || 0;

  var rv = extractStyles(content, namespace, function(entry) {
    var classNameIndex = classNameCounters[baseName]++;
    var stylesheet = {
      id: getStylesheetId(classNameIndex),
      name: baseName,
      style: entry.staticAttributes
    };

    return {
      className: formatClassNameFromStylesheet(stylesheet),
      comment: this.resourcePath + ':' + entry.node.loc.start.line,
    };
  }.bind(this));

  var preamble = '';
  if (rv.css.length > 0) {
    // TODO: resolve loader correctly

    if (!this._compiler.jsxstylePluginEnabled) {
      preamble = 'require(' + JSON.stringify(require.resolve('style-loader/addStyles')) + ')(' +
        JSON.stringify([[this.resourcePath, rv.css]]) + ');';
    } else {
      this._compiler.jsxstyle = this._compiler.jsxstyle || {};
      this._compiler.jsxstyle[this.resourcePath + '.css'] = rv.css;
      preamble = 'require(' + JSON.stringify(this.resourcePath + '.css') + ');';
    }
  }
  return preamble + rv.js;
}

module.exports = webpackLoader;
