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
    ],
    external,
    watch,
  };
});
