import babel from 'rollup-plugin-babel';
import typescript from 'rollup-plugin-typescript2';

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
  ['jsxstyle-utils', 'ts'],
  ['jsxstyle', 'tsx'],
  // 'jsxstyle/preact'
].map(([pkg, ext]) => {
  const filename = pkg.replace(/[^a-z-]/g, '-');
  return {
    input: `packages/${pkg}/${filename}.${ext}`,
    output: [
      { format: 'cjs', file: `packages/${pkg}/${filename}.cjs.js` },
      { format: 'es', file: `packages/${pkg}/${filename}.es.js` },
    ],
    plugins: [
      typescript({
        tsconfig: `packages/${pkg}/tsconfig.json`,
        useTsconfigDeclarationDir: true,
      }),
      babel(babelConfig),
    ],
    external,
    watch,
  };
});
