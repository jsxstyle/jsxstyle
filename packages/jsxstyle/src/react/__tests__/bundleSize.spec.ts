import { OutputOptions, rollup, RollupOptions } from 'rollup';
import rollupNodeResolve from '@rollup/plugin-node-resolve';
import rollupReplace from '@rollup/plugin-replace';
import rollupTerser from '@rollup/plugin-terser';
import zlib from 'zlib';
import { promisify } from 'util';

const gzipAsync = promisify(zlib.gzip);

const entry = 'bundleSize entrypoint';

// that's what, like 1/50th of your average JPG?
const ACCEPTABLE_NUMBER_OF_KILOBYTES = 4;

it(`has a runtime size of less than ${ACCEPTABLE_NUMBER_OF_KILOBYTES}KB`, async () => {
  expect.assertions(4);

  const inputOptions: RollupOptions = {
    external: ['react', 'preact'],
    input: entry,
    plugins: [
      rollupNodeResolve(),
      rollupTerser({ output: { comments: false } }),
      rollupReplace({
        values: {
          'process.env.NODE_ENV': JSON.stringify('production'),
        },
        preventAssignment: true,
      }),
      {
        name: 'custom resolve plugin',
        resolveId(id) {
          if (id === entry) {
            return entry;
          }
          return;
        },
        load(id) {
          if (id === entry) {
            return "export * from 'jsxstyle';\n";
          }
          return;
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
  expect(gzipLen).toBeLessThan(1024 * ACCEPTABLE_NUMBER_OF_KILOBYTES);
});
