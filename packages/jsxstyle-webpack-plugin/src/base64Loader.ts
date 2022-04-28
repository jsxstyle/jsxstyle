import webpack = require('webpack');

/** Webpack loader that decodes the `value` option and returns it as the module source */
function base64Loader(this: webpack.LoaderContext<{ value: string }>) {
  return Buffer.from(
    this.getOptions({
      type: 'object',
      properties: {
        value: {
          type: 'string',
        },
      },
      required: ['value'],
      additionalProperties: false,
    }).value,
    'base64'
  ).toString('utf-8');
}

export = base64Loader;
