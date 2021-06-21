import path = require('path');

import { getCustomLaunchers } from './config/getCustomLaunchers';

// augment karma module with custom config options
declare module 'karma' {
  interface ConfigOptions {
    sauceLabs?: Record<string, any>;
    webpack?:
      | import('webpack').Configuration
      | Array<import('webpack').Configuration>;
    webpackServer?: Record<string, any>;
  }
}

// tslint:disable-next-line no-var-requires
require('dotenv').config();

const getWebpackConfig = ({ useReact15 }: { useReact15: boolean }) => {
  // tslint:disable object-literal-sort-keys
  const webpackConfig: import('webpack').Configuration = {
    devtool: 'inline-source-map',
    mode: 'development',
    resolve: {
      alias: {
        jsxstyle: require.resolve('./packages/jsxstyle'),
        'jsxstyle-utils': require.resolve('./packages/jsxstyle-utils'),
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
              '@babel/preset-react',
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
  // tslint:enable object-literal-sort-keys

  if (useReact15) {
    webpackConfig.resolve!.alias!.react = path.dirname(
      require.resolve('react-15')
    );
    webpackConfig.resolve!.alias!['react-dom'] = path.dirname(
      require.resolve('react-dom-15')
    );
  } else {
    webpackConfig.resolve!.alias!.react = path.dirname(
      require.resolve('react')
    );
    webpackConfig.resolve!.alias!['react-dom'] = path.dirname(
      require.resolve('react-dom')
    );
  }

  return webpackConfig;
};

const isCI = !!process.env.CI;
const useHeadlessChrome =
  process.env.npm_lifecycle_event === 'karma-headless-chrome';

if (!useHeadlessChrome) {
  if (
    isCI &&
    process.env.TRAVIS_PULL_REQUEST !== 'false' &&
    process.env.TRAVIS_SECURE_ENV_VARS !== 'true'
  ) {
    console.info('Karma tests do not run for external pull requests');
    process.exit(0);
  }

  if (!process.env.SAUCE_USERNAME || !process.env.SAUCE_ACCESS_KEY) {
    console.error('SAUCE_USERNAME and SAUCE_ACCESS_KEY must both be set');
    process.exit(1);
  }
}

export default (config: import('karma').Config) => {
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
    const customLaunchers = getCustomLaunchers();
    config.set({
      browsers: Object.keys(customLaunchers),
      concurrency: 5,
      customLaunchers,
      reporters: ['progress', 'saucelabs'],
    });
  }

  let tunnelIdentifier;
  if (isCI) {
    tunnelIdentifier = process.env.TRAVIS_JOB_NUMBER;
  }

  config.set({
    autoWatch: false,
    // 30 seconds
    browserNoActivityTimeout: 30000,
    // three minutes
    captureTimeout: 180000,
    colors: true,
    files: ['packages/**/*.karma.tsx'],
    frameworks: ['jasmine'],
    logLevel: config.LOG_INFO,
    port: 9876,
    preprocessors: {
      '**/*.karma.tsx': ['webpack', 'sourcemap'],
    },
    sauceLabs: {
      connectOptions: {
        connectRetries: 2,
        logfile: 'sauce_connect.log',
      },
      recordScreenshots: true,
      recordVideo: true,
      startConnect: !isCI,
      tags: isCI
        ? ['ci', 'travis:' + process.env.TRAVIS_EVENT_TYPE]
        : ['local'],
      tunnelIdentifier,
    },
    singleRun: true,
    webpack: [
      getWebpackConfig({ useReact15: true }),
      getWebpackConfig({ useReact15: false }),
    ],
    webpackServer: {
      noInfo: true,
    },
  });
};
