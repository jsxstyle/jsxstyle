it('picks the right packages', () => {
  const jsxstylePath = require.resolve('jsxstyle');
  const jsxstyleUtilsPath = require.resolve('jsxstyle-utils');
  const jsxstyleLoaderPath = require.resolve('jsxstyle-loader');

  expect(jsxstylePath).toEqual(require.resolve('../packages/jsxstyle'));
  expect(jsxstyleUtilsPath).toEqual(
    require.resolve('../packages/jsxstyle-utils')
  );
  expect(jsxstyleLoaderPath).toEqual(
    require.resolve('../packages/jsxstyle-loader')
  );
});
