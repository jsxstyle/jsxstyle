// @ts-check

/** @type {import('@babel/core').ConfigFunction} */
module.exports = (api) => {
  const caller = api.caller((caller) => caller?.name);

  if (caller === 'babel-jest') {
    return {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        '@babel/preset-typescript',
      ],
    };
  }

  return {};
};
