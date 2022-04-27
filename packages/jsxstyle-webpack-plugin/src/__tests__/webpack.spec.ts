import path = require('path');
import webpack = require('webpack');

const MemoryFS: any = require('webpack/lib/MemoryOutputFileSystem');
const webpackConfig: webpack.Configuration = require('./webpack/webpack.config');

// one minute
jest.setTimeout(60000);

process.chdir(path.join(__dirname, 'webpack'));

// TODO: evaluate webpack bundle
it('builds without issue', async () => {
  const compiler = webpack(webpackConfig);
  const fs = new MemoryFS();
  compiler.outputFileSystem = fs;

  expect.assertions(4);

  const { redCSS, blueCSS } = await (() =>
    new Promise<{ redCSS: string; blueCSS: string }>((resolve, reject) => {
      compiler.run((err, stats) => {
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
      });
    }))();

  const sharedStyles = `
/* test-app/Shared.js:8 (Block) */
._1jdyhuw._1jdyhuw { font-size:18px }

/* test-app/Shared.js:8 (Block) */
._1n29hly { line-height:22px }

/* test-app/Shared.js:8 (Block) */
._cmecz0 { display:block }

/* test-app/Shared.js:8 (Block) */
._uaq4md._uaq4md { font-family:-apple-system, BlinkMacSystemFont, sans-serif }
`.trim();

  expect(redCSS).toContain(`/* test-app/RedApp.js:8 (Inline) */
._1jvcvsh { color:red }`);

  expect(blueCSS).toContain(`/* test-app/BlueApp.js:8 (Inline) */
._1mb383g { color:blue }`);

  expect(redCSS).toContain(sharedStyles);
  expect(blueCSS).toContain(sharedStyles);
});
