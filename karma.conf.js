const path = require('node:path');

require('dotenv').config();

/** @type {import('webpack').Configuration} */
const webpackConfig = {
  devtool: 'inline-source-map',
  mode: 'development',
  target: 'web',
  resolve: {
    alias: {
      '@jsxstyle/react$': path.dirname(
        require.resolve('./packages/@jsxstyle/react/package.json')
      ),
      '@jsxstyle/core$': require.resolve('@jsxstyle/core'),
      react: path.dirname(require.resolve('react/package.json')),
      'react-dom': path.dirname(require.resolve('react-dom/package.json')),
    },
    extensions: ['.ts', '.tsx', '.js', '.json'],
  },
  performance: { hints: false },
  module: {
    rules: [
      {
        test: /\.(js|tsx?)$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        options: {
          babelrc: false,
          presets: [
            [
              '@babel/preset-env',
              {
                modules: false,
                targets: { browsers: ['last 2 versions'] },
              },
            ],
            ['@babel/preset-react', { runtime: 'automatic' }],
          ],
          plugins: [
            '@babel/plugin-proposal-object-rest-spread',
            '@babel/plugin-transform-object-assign',
          ],
        },
      },
      {
        test: /\.tsx?/,
        loader: require.resolve('ts-loader'),
        options: {
          transpileOnly: true,
        },
      },
    ],
  },
};

const isCI = !!process.env.CI;
const useHeadlessChrome =
  process.env.npm_lifecycle_event === 'karma-headless-chrome';

if (!useHeadlessChrome) {
  if (!process.env.SAUCE_USERNAME || !process.env.SAUCE_ACCESS_KEY) {
    console.error('SAUCE_USERNAME and SAUCE_ACCESS_KEY must both be set');
    process.exit(1);
  }
}

const tzOffset = new Date().getTimezoneOffset();
const [dateString, timeString] = new Date(Date.now() - tzOffset * 60000)
  .toISOString()
  .split(/[T.]/);
const when = `${dateString} ${timeString} GMT${-tzOffset / 60}: `;

const customLaunchers = [
  {
    browserName: 'Chrome',
    platformName: 'Windows 10',
  },
  {
    browserName: 'Firefox',
    platformName: 'Windows 10',
  },
  {
    browserName: 'MicrosoftEdge',
    platformName: 'Windows 10',
  },
].reduce((prev, curr) => {
  const keyPrefix = `sl_${curr.browserName.toLowerCase()}_${curr.platformName.toLowerCase()}`;

  for (const num of [0, 1, 2, 3]) {
    const browserVersion = `latest${num ? '-' + num : ''}`;
    const obj = {
      ...curr,
      base: 'SauceLabs',
      browserVersion,
      'sauce:options': {
        name: `${curr.browserName} on ${curr.platformName} @ ${when}`,
      },
    };

    prev[keyPrefix + '_' + browserVersion] = obj;
  }

  return prev;
}, {});

module.exports = (
  /** @type {(import('karma').Config)} */
  config
) => {
  if (useHeadlessChrome) {
    config.set({
      browsers: [isCI ? 'ChromeHeadlessNoSandbox' : 'ChromeHeadless'],
      concurrency: 1,
      customLaunchers: {
        ChromeHeadlessNoSandbox: {
          base: 'ChromeHeadless',
          browserName: 'ChromeHeadlessNoSandbox',
          flags: ['--no-sandbox'],
        },
      },
      reporters: ['progress'],
    });
  } else {
    config.set({
      browsers: Object.keys(customLaunchers),
      concurrency: 5,
      customLaunchers,
      reporters: ['progress', 'saucelabs'],
    });
  }

  const now = Date.now();

  const tunnelIdentifier = !isCI ? `local_${now}` : process.env.GITHUB_RUN_ID;
  const buildNumber = !isCI ? `build_${now}` : process.env.GITHUB_RUN_ID;

  config.set({
    autoWatch: false,
    // 30 seconds
    browserNoActivityTimeout: 30000,
    // three minutes
    captureTimeout: 180000,
    colors: true,
    files: ['packages/**/*.karma.tsx'],
    frameworks: ['jasmine', 'webpack'],
    logLevel: config.LOG_INFO,
    port: 9876,
    preprocessors: {
      '**/*.karma.tsx': ['webpack', 'sourcemap'],
    },
    sauceLabs: {
      connectOptions: {
        logfile: 'sauce_connect.log',
      },
      recordScreenshots: true,
      recordVideo: true,
      startConnect: true,
      tags: isCI
        ? [
            'ci',
            `actor:${process.env.GITHUB_ACTOR}`,
            `run:${process.env.GITHUB_RUN_NUMBER}`,
          ]
        : ['local'],
      tunnelIdentifier,
      build: buildNumber,
    },
    singleRun: true,
    webpack: webpackConfig,
    webpackServer: {
      noInfo: true,
    },
  });
};
