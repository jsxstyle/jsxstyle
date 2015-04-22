'use strict';

var assign = require('object-assign');

// TODO: package this separately
function autoprefix(style) {
  if (style.hasOwnProperty('userSelect')) {
    style = assign({}, style, {
      WebkitUserSelect: style.userSelect,
      MozUserSelect: style.userSelect,
      msUserSelect: style.userSelect,
    });
  }

  if (style.hasOwnProperty('transition')) {
    assign(style, {
      WebkitTransition: style.transition,
      MozTransition: style.transition,
      msTransition: style.transition,
    });
  }

  if (style.hasOwnProperty('boxShadow')) {
    assign(style, {
      WebkitBoxShadow: style.boxShadow,
      MozBoxShadow: style.boxShadow,
      msBoxSelect: style.boxShadow,
    });
  }
  if (style.hasOwnProperty('fontSmoothing')) {
    assign(style, {
      WebkitFontSmoothing: style.fontSmoothing,
      MozOsxFontSmoothing: style.fontSmoothing === 'antialiased' ? 'grayscale' : undefined,
    });
  }

  return style;
}

module.exports = autoprefix;
