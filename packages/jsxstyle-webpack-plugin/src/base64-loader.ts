import webpack = require('webpack');

const base64Loader = async function (
  this: webpack.LoaderContext<{ value: string }>,
  content: string | Buffer
) {
  return Buffer.from(this.getOptions().value, 'base64').toString('utf-8');
};

export = base64Loader;
