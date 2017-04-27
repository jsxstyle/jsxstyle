'use strict';

const extractStyles = require('./ast-utils/extractStyles');
const writeVirtualModule = require('./writeVirtualModule');

const invariant = require('invariant');
const loaderUtils = require('loader-utils');

function webpackLoader(content) {
  this.cacheable && this.cacheable();
  const namespace = {};

  const query = loaderUtils.getOptions(this) || {};

  // Check for invalid config options
  const keys = Object.keys(query).filter(k => k !== 'constants' && k !== 'styleGroups');
  invariant(
    keys.length === 0,
    `jsxstyle loader received ${keys.length} invalid option${keys.length === 1 ? '' : 's'}: ${keys.join(', ')}`
  );

  if (typeof query.styleGroups !== 'undefined') {
    invariant(
      typeof query.styleGroups === 'object' && query.styleGroups !== null,
      '`styleGroups` option must be an object of style prop objects'
    );
  }

  // Add constants to context object
  if (typeof query.constants !== 'undefined') {
    invariant(
      typeof query.constants === 'object' && query.constants !== null,
      '`constants` option must be an object of paths'
    );
    Object.assign(namespace, query.constants);
  }

  const rv = extractStyles({
    src: content,
    sourceFileName: this.resourcePath,
    staticNamespace: namespace,
    styleGroups: query.styleGroups,
  });

  if (rv.css.length === 0) {
    return content;
  }

  // Add CSS file contents as virtual module
  writeVirtualModule.call(this, rv.cssFileName, rv.css);

  this.callback(null, rv.js, rv.map, rv.ast);
}

module.exports = webpackLoader;
