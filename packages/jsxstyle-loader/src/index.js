'use strict';

const extractStyles = require('./ast-utils/extractStyles');
const writeVirtualModule = require('./writeVirtualModule');

const invariant = require('invariant');
const loaderUtils = require('loader-utils');

function webpackLoader(content) {
  this.cacheable && this.cacheable();
  let whitelistedModules = [];

  const query = loaderUtils.getOptions(this) || {};

  const invalidOptions = Object.keys(query).filter(k => {
    // style group props are validated by extractStyles
    if (k === 'styleGroups' || k === 'namedStyleGroups') {
      return false;
    }
    const option = query[k];

    if (k === 'whitelistedModules') {
      invariant(
        Array.isArray(option),
        '`whitelistedModules` option must be an array of absolute paths'
      );
      // TODO: absolute check (?)
      whitelistedModules = option.slice(0);
      return false;
    } else {
      return true;
    }
  });

  invariant(
    invalidOptions.length === 0,
    // prettier-ignore
    `jsxstyle loader received ${invalidOptions.length} invalid option${invalidOptions.length === 1 ? '' : 's'}: ${invalidOptions.join(', ')}`
  );

  const rv = extractStyles({
    src: content,
    sourceFileName: this.resourcePath,
    whitelistedModules,
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
