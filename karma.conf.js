require('dotenv').config();

module.exports = function(config) {
  const customLaunchers = {};

  // Mobile devices
  [
    ['iOS', '8.4', 'Safari', 'iPhone 6 Simulator'],
    ['iOS', '9.3', 'Safari', 'iPhone 6s Simulator'],
    ['iOS', '10.3', 'Safari', 'iPhone 6s Simulator'],
    ['Android', '4.4', 'Browser', 'Android Emulator'],
    ['Android', '5.0', 'Browser', 'Android Emulator'],
    ['Android', '5.1', 'Browser', 'Android Emulator'],
    ['Android', '6.0', 'Chrome', 'Android Emulator'],
  ].forEach(([p, v, b, d]) => {
    // prettier-ignore
    const k = `sl_${b.replace(/\W+/g, '_')}_${v.replace(/\D+/g, '_')}`.toLowerCase();
    customLaunchers[k] = {
      platformName: p,
      platformVersion: v,
      browserName: b,
      deviceName: d,
      deviceOrientation: 'portrait',
      appiumVersion: '1.6.4',
    };
  });

  // IE and Safari
  [
    ['Windows 8.1', 'internet explorer', '11.0'],
    ['Windows 8', 'internet explorer', '10.0'],
    ['Windows 7', 'internet explorer', '9.0'],
    ['macOS 10.12', 'safari', '10.0'],
    ['OS X 10.11', 'safari', '9.0'],
    ['OS X 10.10', 'safari', '8.0'],
    ['OS X 10.9', 'safari', '7.0'],
  ].forEach(([p, b, v]) => {
    // prettier-ignore
    const k = `sl_${b.replace(/\W+/g, '_')}_${v.replace(/\D+/g, '_')}`.toLowerCase();
    customLaunchers[k] = {
      browserName: b,
      version: v,
      platform: p,
    };
  });

  // Chrome, Firefox, and Edge latest
  ['chrome', 'firefox', 'MicrosoftEdge'].forEach(b => {
    for (let idx = -1; ++idx < 4; ) {
      const k = `sl_${b}_latest${idx > 0 ? `_${idx}` : ''}`.toLowerCase();
      customLaunchers[k] = {
        browserName: b,
        version: `latest${idx > 0 ? `-${idx}` : ''}`,
        platform: 'Windows 10',
      };
    }
  });

  for (const k in customLaunchers) {
    customLaunchers[k].base = 'SauceLabs';
    customLaunchers[k].recordVideo = false;
    customLaunchers[k].recordScreenshots = false;
  }

  config.set({
    frameworks: ['jasmine'],
    customLaunchers,
    browsers: Object.keys(customLaunchers),
    // LOG_DISABLE, LOG_ERROR, LOG_WARN, LOG_INFO, LOG_DEBUG
    logLevel: config.LOG_INFO,
    port: 9876,
    colors: true,
    autoWatch: false,
    singleRun: true,
    concurrency: 5,
    files: ['tests/*.webpack.js'],
    reporters: ['progress', 'saucelabs'],
    preprocessors: {
      'tests/*.webpack.js': ['webpack', 'sourcemap'],
    },
    sauceLabs: {
      recordScreenshots: false,
      testName: `Manual test (${new Date().toLocaleString('en-ZA')})`,
      startConnect: false,
      tunnelIdentifier: process.env.TRAVIS_JOB_NUMBER,
      connectOptions: {
        logfile: 'sauce_connect.log',
      },
    },
    webpackServer: {
      noInfo: true,
    },
    webpack: {
      devtool: 'inline-source-map',
      resolve: { alias: { jsxstyle: __dirname } },
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
