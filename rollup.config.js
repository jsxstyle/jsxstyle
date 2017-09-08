import babel from 'rollup-plugin-babel';

const external = ['invariant', 'jsxstyle', 'preact', 'prop-types', 'react'];

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
    'react',
    [
      'env',
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
  plugins: ['transform-object-assign', 'external-helpers'],
};

export default [
  {
    input: 'src/index.js',
    output: [
      { format: 'cjs', file: 'lib/jsxstyle.cjs.js' },
      { format: 'es', file: 'lib/jsxstyle.es.js' },
    ],
    plugins: [babel(babelConfig)],
    external,
    watch,
  },
  {
    input: 'preact/src/index.js',
    output: [
      { format: 'cjs', file: 'preact/lib/jsxstyle-preact.cjs.js' },
      { format: 'es', file: 'preact/lib/jsxstyle-preact.es.js' },
    ],
    plugins: [babel(babelConfig)],
    external,
    watch,
  },
];
