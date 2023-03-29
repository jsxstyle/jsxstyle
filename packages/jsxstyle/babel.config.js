// @ts-check

/** @type {import('@babel/core').ConfigFunction} */
module.exports = (env) => {
  env.cache.forever();
  return {
    presets: [
      ['@babel/preset-env', { loose: true }],
      ['@babel/preset-typescript', { optimizeConstEnums: true }],
    ],
    plugins: [
      [
        require.resolve('../../misc/babel-plugin-pure-annotation'),
        {
          functionNames: ['factory', 'depFactory', 'componentFactory'],
        },
      ],
    ],
  };
};
