'use strict';

var extractStyles = require('./extractStyles');

function webpackLoader(content) {
  this.cacheable && this.cacheable();
  return content;
}

module.exports = webpackLoader;
