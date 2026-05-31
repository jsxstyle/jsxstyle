import * as path from 'node:path';
import { Volume } from 'memfs';
import webpack from 'webpack';
import webpackConfig from './webpack/webpack.config.js';

process.chdir(path.join(__dirname, 'webpack'));

// TODO: evaluate webpack bundle
it('builds without issue', async () => {
  const compiler = webpack(webpackConfig);
  const fs = new Volume();
  // @ts-expect-error
  compiler.outputFileSystem = fs;

  expect.assertions(4);

  const { redCSS, blueCSS } = await (() =>
    new Promise<{ redCSS: string; blueCSS: string }>((resolve, reject) => {
      compiler.run((err, stats) => {
        try {
          if (err) {
            console.error(err.stack || err);
            if ((err as any).details) {
              console.error((err as any).details);
            }
            return reject(err);
          }

          if (!stats) {
            return reject('Stats is falsey');
          }

          const info = stats.toJson();
          if (stats.hasErrors()) {
            return reject(info.errors);
          }
          if (stats.hasWarnings()) {
            console.warn(info.warnings);
          }

          const outputPath = webpackConfig.output?.path || '';

          const redCSS = fs
            .readFileSync(path.join(outputPath, 'bundle-red.css'), 'utf8')
            .toString();

          const blueCSS = fs
            .readFileSync(path.join(outputPath, 'bundle-blue.css'), 'utf8')
            .toString();

          resolve({ redCSS, blueCSS });
        } catch (err) {
          reject(err);
        }
      });
    }))();

  // Both bundles contain the Inline display:inline extraction
  expect(redCSS).toContain('display:inline');
  expect(blueCSS).toContain('display:inline');

  // Both bundles contain the shared Block styles (display, fontFamily, and
  // cross-module fontSize/lineHeight from LayoutConstants)
  expect(redCSS).toContain('display:block');
  expect(blueCSS).toContain('display:block');
});
