import * as invariant from 'invariant';
import * as karma from 'karma';
import * as webpack from 'webpack';
import getCustomLaunchers from './getCustomLaunchers';

// tslint:disable-next-line no-var-requires
require('dotenv').config();

if (
  process.env.TRAVIS_PULL_REQUEST === 'true' &&
  process.env.TRAVIS_SECURE_ENV_VARS === 'false'
) {
  console.info('Karma tests do not run for external pull requests');
  process.exit(0);
}

invariant(
  !!process.env.SAUCE_USERNAME && !!process.env.SAUCE_ACCESS_KEY,
  'SAUCE_USERNAME and SAUCE_ACCESS_KEY must both be set'
);

const isCI = !!process.env.CI;
const isLocal = !!process.env.KARMA_LOCAL;

export type KarmaConfigOptions = karma.ConfigOptions & {
  customLaunchers?: { [key: string]: any };
  sauceLabs?: any;
  webpack?: webpack.Configuration;
  webpackServer?: any;
};

export interface KarmaConfig extends karma.Config {
  set: (config: KarmaConfigOptions) => void;
}

export default (config: KarmaConfig) => {
  if (isLocal) {
    config.set({
      browsers: ['ChromeHeadless'],
      concurrency: 1,
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

  // tslint:disable object-literal-sort-keys
  const webpackConfig: webpack.Configuration = {
    devtool: 'inline-source-map',
    mode: 'development',
    resolve: {
      alias: {
        jsxstyle: require.resolve('jsxstyle'),
        'jsxstyle-utils': require.resolve('jsxstyle-utils'),
        react: require.resolve('react'),
        'react-dom': require.resolve('react-dom'),
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
                'env',
                {
                  modules: false,
                  targets: { browsers: ['last 2 versions'] },
                },
              ],
              'react',
            ],
            plugins: [
              'transform-object-rest-spread',
              'transform-object-assign',
            ],
          },
        },
        {
          test: /\.tsx?/,
          loader: require.resolve('ts-loader'),
        },
      ],
    },
  };
  // tslint:enable object-literal-sort-keys

  config.set({
    autoWatch: false,
    // 30 seconds
    browserNoActivityTimeout: 30000,
    // three minutes
    captureTimeout: 180000,
    colors: true,
    files: ['**/*.karma.tsx'],
    frameworks: ['jasmine'],
    // LOG_DISABLE, LOG_ERROR, LOG_WARN, LOG_INFO, LOG_DEBUG
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
    webpack: webpackConfig,
    webpackServer: {
      noInfo: true,
    },
  });
};
