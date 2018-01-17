import typescript from 'rollup-plugin-typescript2';

export default [
  ['jsxstyle-utils', 'ts'],
  ['jsxstyle', 'tsx'],
  ['jsxstyle/preact', 'tsx'],
].map(([pkg, ext]) => {
  const filename = pkg.replace(/[^a-z-]/g, '-');
  return {
    input: `packages/${pkg}/${filename}.${ext}`,
    output: [
      {
        format: 'amd',
        file: `packages/${pkg}/${filename}.amd.js`,
        amd: { id: pkg },
      },
      { format: 'cjs', file: `packages/${pkg}/${filename}.cjs.js` },
      { format: 'es', file: `packages/${pkg}/${filename}.es.js` },
    ],
    plugins: [
      typescript({
        tsconfig: `packages/${pkg}/tsconfig.json`,
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
