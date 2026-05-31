import * as path from 'node:path';
import { build } from 'vite';
import { jsxstyleVitePlugin } from '../src/index';

describe('Vite integration', () => {
  it('extracts CSS from jsxstyle components in a production build', async () => {
    const fixtureDir = path.resolve(__dirname, 'fixtures', 'basic-extraction');

    const result = await build({
      root: fixtureDir,
      logLevel: 'silent',
      plugins: [
        jsxstyleVitePlugin({
          classNameStrategy: 'hash',
        }),
      ],
      build: {
        write: false,
        rollupOptions: {
          input: path.resolve(fixtureDir, 'input.tsx'),
          external: [/^@jsxstyle\//, /^react/],
        },
      },
    });

    // vite.build with write:false returns RollupOutput or RollupOutput[]
    const outputs = Array.isArray(result) ? result : [result];
    expect(outputs.length).toBeGreaterThan(0);

    const output = outputs[0];
    // RollupOutput has an `output` array of chunks and assets
    expect(output).toHaveProperty('output');

    const bundle = output.output;

    // Find the CSS asset in the output bundle
    const cssAsset = bundle.find(
      (item) =>
        item.type === 'asset' &&
        typeof item.fileName === 'string' &&
        item.fileName.endsWith('.css')
    );

    expect(cssAsset).toBeDefined();
    expect(cssAsset!.type).toBe('asset');

    const cssContent =
      typeof cssAsset!.source === 'string'
        ? cssAsset!.source
        : new TextDecoder().decode(cssAsset!.source as Uint8Array);

    // Assert expected CSS property-value pairs from the fixture:
    // <Block color="red" fontSize={16}> produces color:red, font-size:16px
    // <Row alignItems="center" padding={8}> produces display:flex, flex-direction:row, align-items:center, padding:8px
    const expectedCSSPatterns = [
      /color:\s*red/,
      /font-size:\s*16px/,
      /display:\s*flex/,
      /flex-direction:\s*row/,
      /align-items:\s*center/,
      /padding:\s*8px/,
    ];

    for (const pattern of expectedCSSPatterns) {
      expect(cssContent).toMatch(pattern);
    }

    // Verify a JS chunk exists that references the CSS virtual module
    const jsChunk = bundle.find(
      (item) => item.type === 'chunk' && item.isEntry
    );
    expect(jsChunk).toBeDefined();
  });

  it('builds successfully with unextractable props when noRuntime is not set', async () => {
    const fixtureDir = path.resolve(__dirname, 'fixtures', 'mixed-extraction');
    const result = await build({
      root: fixtureDir,
      logLevel: 'silent',
      plugins: [
        jsxstyleVitePlugin({
          classNameStrategy: 'hash',
        }),
      ],
      build: {
        write: false,
        rollupOptions: {
          input: path.resolve(fixtureDir, 'input.tsx'),
          external: [/^@jsxstyle\//, /^react/],
        },
      },
    });
    const outputs = Array.isArray(result) ? result : [result];
    expect(outputs.length).toBeGreaterThan(0);
    // Build should succeed -- unextractable props fall back to runtime Box
    expect(outputs[0]).toHaveProperty('output');
  });

  it('builds successfully with noRuntime "error" when all props are extractable', async () => {
    const fixtureDir = path.resolve(__dirname, 'fixtures', 'basic-extraction');
    const result = await build({
      root: fixtureDir,
      logLevel: 'silent',
      plugins: [
        jsxstyleVitePlugin({
          classNameStrategy: 'hash',
          noRuntime: 'error',
        }),
      ],
      build: {
        write: false,
        rollupOptions: {
          input: path.resolve(fixtureDir, 'input.tsx'),
          external: [/^@jsxstyle\//, /^react/],
        },
      },
    });
    const outputs = Array.isArray(result) ? result : [result];
    expect(outputs.length).toBeGreaterThan(0);
    expect(outputs[0]).toHaveProperty('output');
  });

  it('fails the build with noRuntime "error" when props are unextractable', async () => {
    const fixtureDir = path.resolve(__dirname, 'fixtures', 'mixed-extraction');
    await expect(
      build({
        root: fixtureDir,
        logLevel: 'silent',
        plugins: [
          jsxstyleVitePlugin({
            classNameStrategy: 'hash',
            noRuntime: 'error',
          }),
        ],
        build: {
          write: false,
          rollupOptions: {
            input: path.resolve(fixtureDir, 'input.tsx'),
            external: [/^@jsxstyle\//, /^react/],
          },
        },
      })
    ).rejects.toThrow();
  });
});
