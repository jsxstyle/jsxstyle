import invariant = require('invariant');
import karma = require('karma');
import path = require('path');
import webpack = require('webpack');
import getCustomLaunchers from './misc/getCustomLaunchers';

require('dotenv').config();

invariant(
  !!process.env.SAUCE_USERNAME && !!process.env.SAUCE_ACCESS_KEY,
  'SAUCE_USERNAME and SAUCE_ACCESS_KEY must both be set'
);

const isCI = !!process.env.CI;
const isLocal = !!process.env.KARMA_LOCAL;

const pkgPath = pkg => path.join(__dirname, 'packages', pkg);

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
      customLaunchers,
      browsers: Object.keys(customLaunchers),
      concurrency: 5,
      reporters: ['fail-fast', 'progress', 'saucelabs'],
    });
  }

  let tunnelIdentifier;
  if (isCI) {
    tunnelIdentifier = process.env.TRAVIS_JOB_NUMBER;
  }

  config.set({
    frameworks: ['jasmine'],
    // LOG_DISABLE, LOG_ERROR, LOG_WARN, LOG_INFO, LOG_DEBUG
    logLevel: config.LOG_INFO,
    port: 9876,
    colors: true,
    autoWatch: false,
    singleRun: true,
    // three minutes
    captureTimeout: 180000,
    // 30 seconds
    browserNoActivityTimeout: 30000,
    files: ['tests/**/*.karma.js'],
    preprocessors: {
      'tests/**/*.karma.js': ['webpack', 'sourcemap'],
    },
    sauceLabs: {
      recordScreenshots: true,
      recordVideo: true,
      startConnect: !isCI,
      tunnelIdentifier,
      tags: isCI
        ? ['ci', 'travis:' + process.env.TRAVIS_EVENT_TYPE]
        : ['local'],
      connectOptions: {
        logfile: 'sauce_connect.log',
        connectRetries: 2,
      },
    },
    webpackServer: {
      noInfo: true,
    },
    webpack: {
      mode: 'development',
      devtool: 'inline-source-map',
      resolve: {
        alias: {
          jsxstyle: pkgPath('jsxstyle'),
          'jsxstyle-utils': pkgPath('jsxstyle-utils'),
          react: require.resolve('react'),
          'react-dom': require.resolve('react-dom'),
        },
      },
      performance: { hints: false },
      module: {
        rules: [
          {
            test: /\.js$/,
            exclude: /node_modules/,
            loader: 'babel-loader',
            options: {
              babelrc: false,
              presets: [
                [
                  'env',
                  {
                    targets: { browsers: ['last 2 versions'] },
                    modules: false,
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
        ],
      },
    },
  });
};
