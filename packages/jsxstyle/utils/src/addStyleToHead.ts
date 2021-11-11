const canUseDOM = !!(
  typeof window !== 'undefined' &&
  window.document &&
  window.document.createElement
);

const props = {
  styleContainer: canUseDOM
    ? window.document.head
    : (undefined as HTMLElement | undefined),
  styleElement: undefined as HTMLStyleElement | undefined,
};

export function setStyleContainer(container: HTMLElement) {
  props.styleContainer = container;
}

function getStyleElement(): HTMLStyleElement | undefined {
  if (canUseDOM && !props.styleElement) {
    props.styleElement = document.createElement('style');
    props.styleElement.type = 'text/css';
    props.styleElement.appendChild(document.createTextNode('/* jsxstyle */'));
    props.styleContainer?.appendChild(props.styleElement);
  }
  return props.styleElement;
}

export function addStyleToHead(rule: string): void {
  const styleElement = getStyleElement();
  if (styleElement?.sheet != null) {
    const sheet = styleElement.sheet as CSSStyleSheet;
    try {
      sheet.insertRule(rule, sheet.cssRules.length);
    } catch (insertError) {
      // insertRule will fail for rules with pseudoelements the browser doesn't support.
      // see: https://github.com/jsxstyle/jsxstyle/issues/75
      if (process.env.NODE_ENV !== 'production') {
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
