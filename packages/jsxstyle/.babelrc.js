module.exports = {
  presets: [['@babel/preset-env', { loose: true }]],
  plugins: [
    [
      require.resolve('../../misc/babel-plugin-pure-annotation'),
      {
        functionNames: ['factory', 'depFactory', 'componentFactory'],
      },
    ],
  ],
};
