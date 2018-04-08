import { groupBy, flattenDeep } from 'lodash';
import fs = require('fs');
import invariant = require('invariant');
import path = require('path');

const mobilePlatforms = {
  iphone: 'iOS',
  android: 'Android',
};

// https://saucelabs.com/rest/v1/info/platforms/all
// https://saucelabs.com/rest/v1/info/platforms/webdriver
// https://saucelabs.com/rest/v1/info/platforms/appium

interface SauceBase {
  api_name:
    | 'android'
    | 'chrome'
    | 'firefox'
    | 'internet explorer'
    | 'ipad'
    | 'iphone'
    | 'microsoftedge'
    | 'safari';
  automation_backend: 'webdriver' | 'appium';
  latest_stable_version: string;
  long_name: string;
  long_version: string;
  os: string;
  short_version: string;
}

interface WebdriverBrowser extends SauceBase {
  automation_backend: 'webdriver';
}

interface MobileDevice extends SauceBase {
  automation_backend: 'webdriver';
  device: string;
}

interface AppiumDevice extends SauceBase {
  automation_backend: 'appium';
  device: string;
  deprecated_backend_versions: string[];
  recommended_backend_version: string;
  supported_backend_versions: string[];
}

type SauceData = WebdriverBrowser | MobileDevice | AppiumDevice;

interface LauncherBase {
  base: 'SauceLabs';
  browserName: string;
  name: string;
}

interface WebdriverLauncher extends LauncherBase {
  version: string;
}

interface AppiumLauncher extends LauncherBase {
  appiumVersion: string;
  browserName: string;
  deviceName: string;
  platformName: string;
  platformVersion: string;
}

/** Left pads a number with zeros. will fail on numbers greater than 10,000 */
const padNum = (num: string): string => {
  const numInt = parseInt(num, 10);
  if (isNaN(numInt)) return 'NaN_';
  return ('' + (parseInt(num, 10) + 10000)).slice(1);
};

/** Turns each segment of a semver number into a left-padded number */
const semverToSortString = (str: string): string =>
  str
    .split('.')
    .map(padNum)
    .join('.');

/** Sorts SauceBase objects by semver */
const semverSort = (a: SauceBase, b: SauceBase) =>
  semverToSortString(a.short_version).localeCompare(
    semverToSortString(b.short_version)
  );

const sauceDataFile = path.resolve(__dirname, '..', 'saucelabs-appium.json');
invariant(fs.existsSync(sauceDataFile), 'Sauce data file does not exist');

const sauceData: AppiumDevice[] = JSON.parse(
  fs.readFileSync(sauceDataFile, 'utf8')
);
invariant(Array.isArray(sauceData), 'Sauce data is not an array');
invariant(sauceData.length > 10, 'Sauce data is incomplete');

const dataByApiName = groupBy(sauceData, 'api_name');
const apiNames = Object.keys(dataByApiName);

const appiumDevices = flattenDeep<AppiumDevice>(
  apiNames.map(apiName => {
    const groupedByMajorOsVersion = groupBy(
      dataByApiName[apiName],
      d => '' + parseInt(d.short_version, 10)
    );

    // get the latest minor version for each major OS version
    const sauceObjs = Object.keys(groupedByMajorOsVersion).map(
      v => groupedByMajorOsVersion[v].sort(semverSort).slice(-1)[0]
    );

    // return the last 4 versions
    return sauceObjs.slice(-4);
  })
);

const customLaunchers: {
  [key: string]: WebdriverLauncher | AppiumLauncher;
} = {};

// mobile devices
appiumDevices.forEach(data => {
  const key = `sl_${data.api_name}_${data.short_version}`;

  // make sure there aren't any key collisions
  invariant(
    !customLaunchers[key],
    'Key `%s` already exists in customLaunchers',
    key
  );

  if (!mobilePlatforms[data.api_name]) return;

  let browserName;
  if (data.api_name === 'iphone') {
    browserName = 'Safari';
  } else if (data.api_name === 'android') {
    const androidVersion = parseInt(data.short_version, 10);
    if (androidVersion < 6) {
      browserName = 'Browser';
    } else {
      browserName = 'Chrome';
    }
  }

  customLaunchers[key] = {
    base: 'SauceLabs',
    name: `${data.long_name} ${data.short_version}`,
    browserName,
    platformName: mobilePlatforms[data.api_name],
    platformVersion: data.short_version,
    deviceName: data.device,
    // recommended_backend_version can be an empty string
    appiumVersion:
      data.recommended_backend_version ||
      data.supported_backend_versions.slice(-1)[0],
  };
});

// IE 9-11
[11, 10, 9].forEach(v => {
  customLaunchers[`sl_ie_${v}`] = {
    base: 'SauceLabs',
    name: `Internet Explorer ${v}`,
    browserName: 'Internet Explorer',
    version: '' + v,
  };
});

// browsers that support the `latest` field
['MicrosoftEdge', 'Safari', 'Firefox', 'Chrome'].forEach(b => {
  const total = b === 'MicrosoftEdge' ? 3 : 5;
  const niceName = b === 'MicrosoftEdge' ? 'Edge' : b;
  for (let idx = -1; ++idx < total; ) {
    const k = `sl_${b}_latest${idx > 0 ? `-${idx}` : ''}`.toLowerCase();
    const version = `latest${idx > 0 ? `-${idx}` : ''}`;

    customLaunchers[k] = {
      base: 'SauceLabs',
      name: `${niceName} ${version}`,
      browserName: b,
      version,
    };
  }
});

const testPrefix = process.env.TRAVIS_EVENT_TYPE
  ? 'Travis ' + process.env.TRAVIS_EVENT_TYPE.replace(/_/g, ' ')
  : 'Local test';

const tzOffset = new Date().getTimezoneOffset();
const [dateString, timeString] = new Date(Date.now() - tzOffset * 60000)
  .toISOString()
  .split(/[T.]/);
const when = ` @ ${dateString} ${timeString} GMT${-tzOffset / 60}: `;

for (const k in customLaunchers) {
  customLaunchers[k].name = testPrefix + when + customLaunchers[k].name;
}

export = customLaunchers;
