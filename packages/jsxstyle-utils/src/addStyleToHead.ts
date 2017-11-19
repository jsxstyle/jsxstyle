const canUseDOM = !!(
  typeof window !== 'undefined' &&
  window.document &&
  window.document.createElement
);

let styleElement: HTMLStyleElement | undefined;

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

export default function addStyleToHead(rule: string) {
  if (styleElement) {
    const sheet = styleElement.sheet as CSSStyleSheet;
    try {
      sheet.insertRule(rule, sheet.cssRules.length);
    } catch (insertError) {
      // insertRule will fail for rules with pseudoelements the browser doesn't support.
      // see: https://github.com/smyte/jsxstyle/issues/75
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.error(
          '[jsxstyle] Could not insert rule at position ' +
            sheet.cssRules.length +
            ': `' +
            rule +
            '`'
        );
      }
    }
  }
}
