'use strict';

const canUseDOM = !!(
  typeof window !== 'undefined' &&
  window.document &&
  window.document.createElement
);

let styleElement;

if (module.hot) {
  if (typeof module.hot.data === 'object') {
    styleElement = module.hot.data.styleElement;
  }

  module.hot.addDisposeHandler(function(data) {
    data.styleElement = styleElement;
  });
}

if (canUseDOM && !styleElement) {
  styleElement = document.createElement('style');
  styleElement.type = 'text/css';
  styleElement.appendChild(document.createTextNode('/* jsxstyle */'));
  document.head.appendChild(styleElement);
}

function addStyleToHead(rule) {
  if (canUseDOM) {
    try {
      styleElement.sheet.insertRule(rule, styleElement.sheet.cssRules.length);
    } catch (insertError) {
      // insertRule will fail for rules with pseudoelements the browser doesn't support.
      // see: https://github.com/smyte/jsxstyle/issues/75
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.error(
          '[jsxstyle] Could not add style to head: %O',
          insertError
        );
      }
    }
  }
}

module.exports = addStyleToHead;
