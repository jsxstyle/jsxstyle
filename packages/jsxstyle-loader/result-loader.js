'use strict';

// Hey! Listen!
// This webpack loader is not designed to be used in isolation.
// It will automatically be applied when it is needed.

// If you're looking for the public-facing loader, check out loader.js.

const jsxstyleKey = require('./utils/getKey')();
const path = require('path');
const invariant = require('invariant');

// jsxstyleResultLoader replaces the contents of what it's loading with the CSS
// extracted by jsxstyle-loader.
function jsxstyleResultLoader() {
  this.cacheable && this.cacheable();
  invariant(this[jsxstyleKey], 'this[jsxstyleKey] is not set!');

  const {
    fileList,
    needsAdditionalPass,
    aggregateFile,
    useCSSImport,
    memoryFS,
  } = this[jsxstyleKey];

  if (needsAdditionalPass) return '/* first pass */';

  const relativeTo = path.dirname(aggregateFile);

  const mapFn = useCSSImport
    ? f => `@import ${JSON.stringify(path.relative(relativeTo, f))};`
    : f => memoryFS.readFileSync(f, 'utf8') + '\n';

  this.callback(null, Array.from(fileList).map(mapFn).join('\n'));
}

jsxstyleResultLoader.pitch = function() {
  // add result-loader to the front of the stack so it can provide raw CSS to
  // subsequent loaders.
  const thisIndex = this.loaders.findIndex(obj => obj.path === __filename);
  const self = this.loaders[thisIndex];
  this.loaders.splice(thisIndex, 1);
  this.loaders.push(self);
};

module.exports = jsxstyleResultLoader;
