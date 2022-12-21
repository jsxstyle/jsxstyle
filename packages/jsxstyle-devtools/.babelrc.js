// @ts-check

/** @type {import('@babel/core').TransformOptions} */
module.exports = {
  extends: '../../babel.config.js',
  presets: [
    [
      '@babel/preset-react',
      {
        runtime: 'automatic', // defaults to classic
      },
    ],
  ],
};
