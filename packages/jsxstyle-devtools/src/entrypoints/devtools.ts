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
