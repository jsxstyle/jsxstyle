import { makeCustomProperties } from '@jsxstyle/core';

export const styleConstants = makeCustomProperties(
  {
    code: {
      background: '#fff',
      keyword: 'rgb(199, 129, 0)',
      string: 'rgb(111, 184, 65)',
      comment: '#888888',
      selector: 'rgb(0, 141, 206)',
      punctuation: '#888888',
      tag: 'rgb(175, 155, 0)',
      plainText: '#000',
      className: 'rgb(0, 118, 173)',
      attrName: 'rgb(55, 159, 200)',
      attrValue: 'rgb(106, 172, 68)',
      attrEquals: '#888888',
    },
    color: {
      foreground: '#333',
      background: '#FFF',
      pageBackground: '#EEE',
      border: '#BBB',
      editorBackground: '#AAA',
      insetBackground: '#DDD',
    },
    shadow: {
      frameworkTile: '0 3px 5px 0 rgba(0, 0, 0, 0.2)',
    },
  },
  {
    colorScheme: 'light',
  }
)
  .addVariant(
    'darkMode',
    {
      code: {
        background: 'rgba(0,0,0,0.3)',
        keyword: '#ffd14a',
        string: '#98ec65',
        comment: '#888888',
        selector: '#00aeff',
        punctuation: '#888888',
        tag: '#ffd700',
        plainText: '#FFF',
        className: '#00aeff',
        attrName: '#88ddff',
        attrValue: '#91dd64',
        attrEquals: '#888888',
      },
      color: {
        foreground: '#fff',
        background: '#222',
        pageBackground: '#333',
        border: '#666',
        editorBackground: '#1e1e1e',
        insetBackground: '#000',
      },
      shadow: {
        frameworkTile: '0 3px 5px 0 rgba(0,0,0,1)',
      },
    },
    {
      mediaQuery: 'screen and (prefers-color-scheme: dark)',
      colorScheme: 'dark',
    }
  )
  .build({
    mangle: true,
    namespace: 'm',
  });
