import babel from 'rollup-plugin-babel';

const external = [
  'invariant',
  'jsxstyle',
  'jsxstyle-utils',
  'preact',
  'prop-types',
  'react',
];

const watch = { exclude: ['node_modules/**'] };

const babelConfig = {
  // without this setting, asyncGenerator is included but not used (???)
  externalHelpersWhitelist: [
    'classCallCheck',
    'inherits',
    'possibleConstructorReturn',
    'extends',
  ],
  exclude: 'node_modules/**',
  babelrc: false,
  presets: [
    require.resolve('babel-preset-react'),
    [
      require.resolve('babel-preset-env'),
      {
        targets: { browsers: ['last 2 versions'] },
        loose: true,
        modules: false,
        // debug: true,
        exclude: [
          // don't need fancy typeof
          'transform-es2015-typeof-symbol',
        ],
      },
    ],
  ],
  plugins: [
    require.resolve('babel-plugin-transform-class-properties'),
    require.resolve('babel-plugin-transform-object-assign'),
    require.resolve('babel-plugin-external-helpers'),
  ],
};

export default [
  'jsxstyle-utils/jsxstyle-utils',
  'jsxstyle/jsxstyle',
  'jsxstyle/preact/jsxstyle-preact',
].map(pkg => ({
  input: `packages/${pkg}.js`,
  output: [
    { format: 'cjs', file: `packages/${pkg}.cjs.js` },
    { format: 'es', file: `packages/${pkg}.es.js` },
  ],
  plugins: [babel(babelConfig)],
  external,
  watch,
}));
