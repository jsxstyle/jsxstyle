const canUseDOM = !!(
  typeof window !== 'undefined' &&
  window.document &&
  window.document.createElement
);

let styleElement: HTMLStyleElement | undefined;

interface HotData {
  styleElement: typeof styleElement;
}

interface ModuleHot<T = HotData> {
  hot: {
    data: T;
    addDisposeHandler: (handler: (data: T) => void) => void;
  };
}

if (
  typeof module !== 'undefined' &&
  (module as any).hot &&
  typeof (module as any).hot.addDisposeHandler === 'function'
) {
  // gross
  const { hot } = (module as any) as ModuleHot;
  if (typeof hot.data === 'object') {
    styleElement = hot.data.styleElement;
  }

  hot.addDisposeHandler(data => {
    data.styleElement = styleElement;
  });
}

if (canUseDOM && !styleElement) {
  styleElement = document.createElement('style');
  styleElement.type = 'text/css';
  styleElement.appendChild(document.createTextNode('/* jsxstyle */'));
  document.head.appendChild(styleElement);
}

export default function addStyleToHead(rule: string): void {
  if (styleElement) {
    const sheet = styleElement.sheet as CSSStyleSheet;
    try {
      sheet.insertRule(rule, sheet.cssRules.length);
    } catch (insertError) {
      // insertRule will fail for rules with pseudoelements the browser doesn't support.
      // see: https://github.com/smyte/jsxstyle/issues/75
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
