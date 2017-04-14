'use strict';

const extractStyles = require('./ast-utils/extractStyles');
const writeVirtualModule = require('./writeVirtualModule');

const invariant = require('invariant');
const loaderUtils = require('loader-utils');
const path = require('path');
const stringHash = require('jsxstyle/lib/stringHash');

const getStyleObjectFromProps = require('jsxstyle/lib/getStyleObjectFromProps');
const getStyleKeyForStyleObject = require('jsxstyle/lib/getStyleKeyForStyleObject');

function webpackLoader(content) {
  this.cacheable && this.cacheable();
  const namespace = {};

  const query = loaderUtils.getOptions(this) || {};

  // Check for invalid config options
  const keys = Object.keys(query).filter(k => k !== 'constants');
  invariant(
    keys.length === 0,
    `jsxstyle loader received ${keys.length} invalid option${keys.length === 1 ? '' : 's'}: ${keys.join(', ')}`
  );

  // Add constants to context object
  if (typeof query.constants !== 'undefined') {
    invariant(
      typeof query.constants === 'object' && query.constants !== null,
      '`constants` option must be an object of paths'
    );
    for (const key in query.constants) {
      namespace[key] = require(query.constants[key]);
    }
  }

  const cssFileName = `${this.resourcePath}.${stringHash(this.resourcePath)}.css`;

  const rv = extractStyles(content, cssFileName, namespace, entry => {
    const styleProps = getStyleObjectFromProps(entry.staticAttributes);
    const styleKey = getStyleKeyForStyleObject(styleProps);
    const lineNumbers =
      entry.node.loc.start.line +
      (entry.node.loc.start.line !== entry.node.loc.end.line ? `-${entry.node.loc.end.line}` : '');

    // styleKey is null if passed object is empty
    if (!styleKey) {
      return {};
    }

    return {
      className: `_x_${styleKey.toString(36)}`,
      commentText: `${path.relative(process.cwd(), this.resourcePath)}:${lineNumbers} (${entry.originalNodeName})`,
    };
  });

  if (rv.css.length === 0) {
    return content;
  }

  // if component changes, the required CSS file probably changed as well
  // TODO: is this necessary?
  this.addDependency(cssFileName);

  // Add CSS file contents as virtual module
  writeVirtualModule.call(this, cssFileName, rv.css);

  this.callback(null, rv.js, rv.map);
}

module.exports = webpackLoader;
