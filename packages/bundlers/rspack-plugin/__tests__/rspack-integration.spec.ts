import * as fs from 'node:fs';
import * as path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Rspack integration', () => {
  it('extracts CSS from jsxstyle components', async () => {
    // Dynamic import @rspack/core to avoid peer dep issues at the root
    const { rspack } = await import('@rspack/core');
    const { JsxstyleRspackPlugin } = await import('../src/plugin.js');

    const fixtureDir = path.resolve(__dirname, 'fixtures/basic');
    const outputDir = path.resolve(__dirname, '.rspack-output');

    const compiler = rspack({
      mode: 'production',
      target: 'web',
      context: fixtureDir,
      entry: './input.tsx',
      output: {
        path: outputDir,
        filename: 'bundle.js',
        cssFilename: '[name].css',
      },
      resolve: {
        extensions: ['.tsx', '.ts', '.js'],
      },
      module: {
        rules: [
          {
            test: /\.tsx?$/,
            use: [
              {
                loader: 'builtin:swc-loader',
                options: {
                  jsc: {
                    parser: {
                      syntax: 'typescript',
                      tsx: true,
                    },
                  },
                },
              },
            ],
          },
          {
            test: /\.css$/,
            type: 'css',
          },
        ],
      },
      plugins: [
        new JsxstyleRspackPlugin({
          classNameStrategy: 'hash',
          classNamePrefix: '_x',
        }),
      ],
      experiments: {
        css: true,
      },
      externals: [/^@jsxstyle\//, /^react/],
    });

    const stats = await new Promise<any>((resolve, reject) => {
      compiler.run((err, stats) => {
        if (err) reject(err);
        else resolve(stats);
      });
    });

    if (stats.hasErrors()) {
      const info = stats.toJson({ errors: true });
      console.error(
        'Rspack build errors:',
        JSON.stringify(info.errors, null, 2)
      );
    }
    expect(stats.hasErrors()).toBe(false);

    // Find CSS in output assets
    const statsJson = stats.toJson({ assets: true });
    const cssAsset = statsJson.assets?.find((a: any) =>
      a.name.endsWith('.css')
    );

    // Verify CSS was extracted
    expect(cssAsset).toBeDefined();

    // Read the CSS content from the output
    const cssContent = fs.readFileSync(
      path.join(outputDir, cssAsset!.name),
      'utf8'
    );

    // Verify expected CSS properties are present.
    // Note: Rspack's CSS minifier converts named colors to shorter hex codes
    // (e.g., "blue" -> "#00f"), so we match the minified form.
    expect(cssContent).toContain('color:red');
    expect(cssContent).toContain('font-size:16px');
    expect(cssContent).toContain('background-color:#00f');
    expect(cssContent).toContain('padding:8px');
    expect(cssContent).toContain('display:flex');
    expect(cssContent).toContain('flex-direction:row');

    // Clean up
    fs.rmSync(outputDir, { recursive: true, force: true });
  });
});
