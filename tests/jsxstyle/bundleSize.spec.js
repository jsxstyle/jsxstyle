import path from 'path';
import { rollup } from 'rollup';
import rollupNodeResolve from 'rollup-plugin-node-resolve';
import rollupReplace from 'rollup-plugin-replace';
import rollupUglify from 'rollup-plugin-uglify';
import zlib from 'zlib';

const entry = 'bundleSize entrypoint';

it('has a runtime size of less than 3KB', () => {
  expect.assertions(3);

  const inputOptions = {
    input: entry,
    external: ['react', 'preact'],
    plugins: [
      rollupNodeResolve({
        jail: path.resolve(__dirname, '../../'),
        customResolveOptions: {
          moduleDirectory: 'packages',
        },
      }),
      rollupUglify(),
      rollupReplace({
        'process.env.NODE_ENV': JSON.stringify('production'),
      }),
      {
        resolveId(id) {
          if (id === entry) return entry;
        },
        load(id) {
          if (id === entry) return "export * from 'jsxstyle';\n";
        },
      },
    ],
  };

  const outputOptions = { format: 'cjs' };

  return new Promise((resolve, reject) => {
    rollup(inputOptions)
      .then(bundle => {
        bundle
          .generate(outputOptions)
          .then(({ code }) => {
            zlib.deflate(code, (err, buf) => {
              if (err) reject(err);
              const strLen = Buffer.byteLength(code);
              const gzipLen = buf.byteLength;
              // eslint-disable-next-line no-console
              console.warn(
                'jsxstyle bundle size: %s bytes (%skb)',
                strLen,
                (strLen / 1024).toFixed(4)
              );
              // eslint-disable-next-line no-console
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
            });
          })
          .catch(err => reject(err));
      })
      .catch(err => reject(err));
  });
});
