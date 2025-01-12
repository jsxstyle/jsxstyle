import * as path from 'node:path';

/** Generate an import statement with CSS passed as a base64-encoded loader option */
export const getInlineImportString = (css: string, key: string) =>
  // this path does not exist
  path.join('@jsxstyle/core', 'cache', `${key}.css`) +
  // https://webpack.js.org/api/loaders/#inline-matchresource
  '!=!' +
  // this loader base64 decodes the `value` string
  '@jsxstyle/webpack-plugin/base64-loader' +
  '?' +
  new URLSearchParams({
    value: Buffer.from(css).toString('base64'),
  }).toString() +
  '!' +
  // the contents of this file will be discarded
  '@jsxstyle/webpack-plugin/noop';
