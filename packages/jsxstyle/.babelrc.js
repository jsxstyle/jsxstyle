// @ts-check

/** @type {import('@babel/core').TransformOptions} */
module.exports = {
  plugins: [
    [
      require.resolve('../../misc/babel-plugin-pure-annotation'),
      {
        functionNames: ['factory', 'depFactory', 'componentFactory'],
      },
    ],
  ],
};
