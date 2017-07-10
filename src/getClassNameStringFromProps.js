'use strict';

const getStyleKeysForProps = require('./getStyleKeysForProps');
const addStyleToHead = require('./addStyleToHead');
const stringHash = require('./stringHash');

const classNameCache = {};

function getClassNameStringFromProps(props) {
  let classNameString = props.className;
  const styleObj = getStyleKeysForProps(props);
  if (styleObj) {
    for (const keyPrefix in styleObj) {
      const value = styleObj[keyPrefix];
      const key = keyPrefix + value.css;
      const classNamePrefix =
        '_' +
        (value.mediaQuery || value.pseudoclass
          ? (value.mediaQuery ? 'm' : '') + (value.pseudoclass ? 'p' : '')
          : 'j');

      if (!classNameCache.hasOwnProperty(key)) {
        classNameCache[key] = stringHash(key).toString(36);
      }

      const className = classNamePrefix + classNameCache[key];
      if (!classNameString) {
        classNameString = className;
      } else {
        classNameString += ' ' + className;
      }

      addStyleToHead(className, value);
    }
  }
  return classNameString;
}

module.exports = getClassNameStringFromProps;
