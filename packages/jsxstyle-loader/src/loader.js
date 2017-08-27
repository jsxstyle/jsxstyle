'use strict';

const extractStyles = require('./ast-utils/extractStyles');
const jsxstyleKey = require('./getKey')();

const invariant = require('invariant');
const loaderUtils = require('loader-utils');
const path = require('path');

function webpackLoader(content) {
  this.cacheable && this.cacheable();
  let whitelistedModules = [];
  let parserPlugins = [];

  invariant(
    this[jsxstyleKey],
    'jsxstyle-loader cannot be used without the corresponding plugin'
  );

  const {
    memoryFS,
    cacheObject,
    fileList,
    combineCSS,
    needsAdditionalPass,
  } = this[jsxstyleKey];

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
    } else if (k === 'parserPlugins') {
      invariant(
        Array.isArray(option),
        '`parserPlugins` option must be an array of babylon plugins. You can see a full list of available plugins here: https://git.io/v5ITC'
      );
      parserPlugins = option.slice(0);
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
    parserPlugins,
    cacheObject,
    addCSSRequire: !combineCSS,
  });

  if (rv.css.length === 0) {
    return content;
  }

  memoryFS.mkdirpSync(path.dirname(rv.cssFileName));
  memoryFS.writeFileSync(rv.cssFileName, rv.css);
  if (combineCSS && !needsAdditionalPass) {
    fileList.add(rv.cssFileName);
  }

  this.callback(null, rv.js, rv.map, rv.ast);
}

module.exports = webpackLoader;
