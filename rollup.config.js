import typescript from 'rollup-plugin-typescript2';

export default [
  ['jsxstyle-utils', 'ts'],
  ['jsxstyle', 'tsx'],
  ['jsxstyle/preact', 'tsx'],
].map(([pkg, ext]) => {
  const filename = pkg.replace(/[^a-z-]/g, '-');
  return {
    input: `packages/${pkg}/src/${filename}.${ext}`,
    output: [
      {
        format: 'amd',
        file: `packages/${pkg}/lib/${filename}.js`,
        amd: { id: pkg },
      },
      { format: 'cjs', file: `packages/${pkg}/lib/${filename}.cjs.js` },
      { format: 'es', file: `packages/${pkg}/lib/${filename}.es.js` },
    ],
    plugins: [
      typescript({
        tsconfig: `packages/${pkg}/src/tsconfig.json`,
        useTsconfigDeclarationDir: true,
      }),
    ],
    external: [
      'invariant',
      'jsxstyle',
      'jsxstyle-utils',
      'preact',
      'prop-types',
      'react',
    ],
    watch: { exclude: ['node_modules/**'] },
  };
});
