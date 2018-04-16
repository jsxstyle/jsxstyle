const { cache } = require('jsxstyle');
const React = require('react');

let css = '';
cache.injectOptions({
  onInsertRule: rule => {
    css += rule;
  },
});

exports.onRenderBody = ({ setHeadComponents }) => {
  // add runtime styles to document head
  cache.reset();
  if (css.trim() !== '') {
    setHeadComponents([
      React.createElement('style', {
        key: 'jsxstyle-runtime-styles',
        dangerouslySetInnerHTML: { __html: css },
      }),
    ]);
  }
  css = '';
};
