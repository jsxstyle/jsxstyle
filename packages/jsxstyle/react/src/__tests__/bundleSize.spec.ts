import * as path from 'path';
import { OutputOptions, rollup, RollupOptions } from 'rollup';
import rollupNodeResolve from '@rollup/plugin-node-resolve';
import rollupReplace from '@rollup/plugin-replace';
import { terser as rollupTerser } from 'rollup-plugin-terser';
import zlib = require('zlib');
import { promisify } from 'util';

const gzipAsync = promisify(zlib.gzip);

const entry = 'bundleSize entrypoint';

it('has a runtime size of less than 3KB', async () => {
  expect.assertions(4);

  const inputOptions: RollupOptions = {
    external: ['react', 'preact'],
    input: entry,
    plugins: [
      rollupNodeResolve({
        moduleDirectories: ['packages'],
        jail: path.resolve(__dirname, '../../'),
      }),
      rollupTerser({ output: { comments: false } }),
      rollupReplace({
        'process.env.NODE_ENV': JSON.stringify('production'),
      }),
      {
        name: 'custom resolve plugin',
        resolveId(id): any {
          if (id === entry) {
            return entry;
          }
        },
        load(id): any {
          if (id === entry) {
            return "export * from 'jsxstyle';\n";
          }
        },
      },
    ],
  };

  const outputOptions: OutputOptions = { format: 'cjs' };

  const bundle = await rollup(inputOptions);
  const result = await bundle.generate(outputOptions);

  expect(result.output.length).toEqual(1);

  // TODO: narrow this correctly
  const code = result.output[0].code;

  if (!code) {
    throw new Error('Generated bundle resulted in a falsey value');
  }

  const codeLen = Buffer.byteLength(code);
  const gzipLen = (await gzipAsync(code)).byteLength;
  console.warn(
    'jsxstyle bundle size: %s bytes (%skb)',
    codeLen,
    (codeLen / 1024).toFixed(4)
  );
  console.warn(
    'jsxstyle bundle size (gzip): %s bytes (%skb)',
    gzipLen,
    (gzipLen / 1024).toFixed(4)
  );
  // ensure jsxstyle and jsxstyle-utils are bundled
  expect(code).not.toMatch(/require\(['"]jsxstyle['"]\)/);
  expect(code).not.toMatch(/require\(['"]jsxstyle\/utils['"]\)/);
  // check file size
  expect(gzipLen).toBeLessThan(1024 * 3);
});
