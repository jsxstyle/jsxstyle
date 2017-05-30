'use strict';

const extractStyles = require('./ast-utils/extractStyles');
const writeVirtualModule = require('./writeVirtualModule');

const invariant = require('invariant');
const loaderUtils = require('loader-utils');

function webpackLoader(content) {
  this.cacheable && this.cacheable();
  const staticNamespace = {};

  const query = loaderUtils.getOptions(this) || {};

  const invalidOptions = Object.keys(query).filter(k => {
    // style group props are validated by extractStyles
    if (k === 'styleGroups' || k === 'namedStyleGroups') {
      return false;
    }

    if (k === 'constants') {
      const constants = query[k];
      invariant(
        typeof constants === 'object' && constants !== null,
        '`constants` option must be an object of paths'
      );
      Object.assign(staticNamespace, constants);
      return false;
    } else {
      return true;
    }
  });

  invariant(
    invalidOptions.length === 0,
    `jsxstyle loader received ${invalidOptions.length} invalid option${invalidOptions.length === 1 ? '' : 's'}: ${invalidOptions.join(', ')}`
  );

  const rv = extractStyles({
    src: content,
    sourceFileName: this.resourcePath,
    staticNamespace,
    styleGroups: query.styleGroups,
    namedStyleGroups: query.namedStyleGroups,
  });

  if (rv.css.length === 0) {
    return content;
  }

  // Add CSS file contents as virtual module
  writeVirtualModule.call(this, rv.cssFileName, rv.css);

  this.callback(null, rv.js, rv.map, rv.ast);
}

module.exports = webpackLoader;
