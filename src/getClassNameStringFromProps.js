'use strict';

const getStyleKeysForProps = require('./getStyleKeysForProps');
const addStyleToHead = require('./addStyleToHead');
const stringHash = require('./stringHash');

let classNameCache;

if (module.hot) {
  if (typeof module.hot.data === 'object') {
    classNameCache = module.hot.data.classNameCache;
  }

  module.hot.addDisposeHandler(function(data) {
    data.classNameCache = classNameCache;
  });
}

if (!classNameCache) {
  classNameCache = {};
}

function getClassNameStringFromProps(props, classNameProp) {
  const styleObj = getStyleKeysForProps(props);
  if (typeof styleObj !== 'object' || styleObj === null) {
    return classNameProp || null;
  }

  const key = styleObj.classNameKey;
  if (!classNameCache.hasOwnProperty(key)) {
    classNameCache[key] = '_' + stringHash(key).toString(36);
    delete styleObj.classNameKey;
    Object.keys(styleObj)
      .sort()
      .forEach(k => addStyleToHead(classNameCache[key], styleObj[k]));
  }

  return classNameCache[key] && classNameProp
    ? classNameCache[key] + ' ' + classNameProp
    : classNameCache[key] || classNameProp || null;
}

module.exports = getClassNameStringFromProps;
