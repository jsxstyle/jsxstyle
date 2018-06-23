import path = require('path');
import { OutputOptions, rollup } from 'rollup';
import rollupNodeResolve = require('rollup-plugin-node-resolve');
import rollupReplace = require('rollup-plugin-replace');
import { uglify as rollupUglify } from 'rollup-plugin-uglify';
import zlib = require('zlib');

const entry = 'bundleSize entrypoint';

it('has a runtime size of less than 3KB', async () => {
  expect.assertions(3);

  const inputOptions = {
    external: ['react', 'preact'],
    input: entry,
    plugins: [
      rollupNodeResolve({
        customResolveOptions: {
          moduleDirectory: 'packages',
        },
        jail: path.resolve(__dirname, '../../'),
      }),
      rollupUglify(),
      rollupReplace({
        'process.env.NODE_ENV': JSON.stringify('production'),
      }),
      {
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

  // TODO: narrow this correctly
  const code = (result as any).code;

  return new Promise((resolve, reject) =>
    zlib.deflate(code, (err, buf) => {
      if (err) {
        return reject(err);
      }
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
      resolve();
    })
  );
});
