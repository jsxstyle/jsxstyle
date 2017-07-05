'use strict';

function getStyleObjectFromProps(props) {
  const style = {};

  for (const key in props) {
    if (
      key === 'children' ||
      key === 'className' ||
      key === 'component' ||
      key === 'props' ||
      key === 'style'
    ) {
      continue;
    }
    style[key] = props[key];
  }

  return style;
}

module.exports = getStyleObjectFromProps;
