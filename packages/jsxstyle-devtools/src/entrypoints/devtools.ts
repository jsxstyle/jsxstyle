chrome.devtools.inspectedWindow.eval(
  'window.__JSXSTYLE_RUNTIME__',
  (result, error) => {
    console.log(result, error);
  }
);

chrome.devtools.panels.create(
  'jsxstyle',
  '/icons/star.png',
  '/lib/devtoolsPanel.html',
  (newPanel) => {
    newPanel.onShown.addListener(() => {
      console.log('panel is being shown');
    });
    newPanel.onHidden.addListener(() => {
      console.log('panel is being hidden');
    });
  }
);
