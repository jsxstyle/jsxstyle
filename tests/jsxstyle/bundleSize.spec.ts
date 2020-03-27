import path = require('path');
import { OutputOptions, rollup, RollupOptions } from 'rollup';
import rollupNodeResolve from 'rollup-plugin-node-resolve';
import rollupReplace from 'rollup-plugin-replace';
import { terser as rollupTerser } from 'rollup-plugin-terser';
import zlib = require('zlib');

const entry = 'bundleSize entrypoint';

it('has a runtime size of less than 3KB', async () => {
  expect.assertions(4);

  const inputOptions: RollupOptions = {
    external: ['react', 'preact'],
    input: entry,
    plugins: [
      rollupNodeResolve({
        customResolveOptions: {
          moduleDirectory: 'packages',
        },
        jail: path.resolve(__dirname, '../../'),
      }),
      rollupTerser({ output: { comments: false } }),
      rollupReplace({
        'process.env.NODE_ENV': JSON.stringify('production'),
      }),
      {
        name: 'custom resolve plugin',
        resolveId(id) {
          if (id === entry) {
            return entry;
          }
        },
        load(id) {
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

  const buf = await new Promise<Buffer>((resolve, reject) => {
    return zlib.deflate(code, (err, buf) => {
      if (err) {
        reject(err);
      } else {
        resolve(buf);
      }
    });
  });

  const strLen = Buffer.byteLength(code);
  const gzipLen = buf.byteLength;
  console.warn(
    'jsxstyle bundle size: %s bytes (%skb)',
    strLen,
    (strLen / 1024).toFixed(4)
  );
  console.warn(
    'jsxstyle bundle size (gzip): %s bytes (%skb)',
    gzipLen,
    (gzipLen / 1024).toFixed(4)
  );
  // ensure jsxstyle and jsxstyle-utils are bundled
  expect(code).not.toMatch(/require\(['"]jsxstyle['"]\)/);
  expect(code).not.toMatch(/require\(['"]jsxstyle-utils['"]\)/);
  // check file size
  expect(gzipLen).toBeLessThan(1024 * 3);
});
