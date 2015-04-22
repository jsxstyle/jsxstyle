'use strict';

var extractStyles = require('./extractStyles');
var loaderUtils = require('loader-utils');
var path = require('path');

var seenBaseNames = {};
var classNameCounters = {};

function webpackLoader(content) {
  this.cacheable && this.cacheable();
  var namespaceModule = loaderUtils.parseQuery(this.query).namespace;
  var namespace = namespaceModule ? require(namespaceModule) : {};

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

    return {
      className: baseName + '_' + classNameIndex,
      comment: this.resourcePath + ':' + entry.node.loc.start.line,
    };
  }.bind(this));

  var preamble = '';
  if (rv.css.length > 0) {
    preamble = 'require(' + JSON.stringify(require.resolve('style-loader/addStyles')) + ')(' +
      JSON.stringify([['honk', rv.css]]) + ');';
  }
  return preamble + rv.js;
}

module.exports = webpackLoader;
