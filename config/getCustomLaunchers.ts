import fs = require('fs');
import invariant from 'invariant';
import { flattenDeep, groupBy, sample, uniqBy } from 'lodash';
import path = require('path');

const mobilePlatforms = {
  android: 'Android',
  iphone: 'iOS',
};

export type SauceApiName =
  | 'android'
  | 'chrome'
  | 'firefox'
  | 'internet explorer'
  | 'ipad'
  | 'iphone'
  | 'microsoftedge'
  | 'safari';

export interface SauceBase {
  api_name: SauceApiName;
  automation_backend: 'webdriver' | 'appium';
  latest_stable_version: string;
  long_name: string;
  long_version: string;
  os: string;
  short_version: string;
}

export interface WebdriverBrowser extends SauceBase {
  automation_backend: 'webdriver';
}

export interface MobileDevice extends SauceBase {
  automation_backend: 'webdriver';
  device: string;
}

export interface AppiumDevice extends SauceBase {
  automation_backend: 'appium';
  device: string;
  deprecated_backend_versions: string[];
  recommended_backend_version: string;
  supported_backend_versions: string[];
}

export type SauceData = WebdriverBrowser | MobileDevice | AppiumDevice;

export interface LauncherBase {
  base: 'SauceLabs';
  browserName: string;
  name: string;
}

export interface WebdriverLauncher extends LauncherBase {
  version: string;
  platform?: string;
}

export interface AppiumLauncher extends LauncherBase {
  appiumVersion: string;
  browserName: string;
  deviceName: string;
  platformName: string;
  platformVersion: string;
}

export type Launcher = WebdriverLauncher | AppiumLauncher;

/** Left pads a number with zeros. will fail on numbers greater than 10,000 */
const padNum = (num: string): string => {
  const numInt = parseInt(num, 10);
  if (isNaN(numInt)) {
    return 'NaN_';
  }
  return ('' + (parseInt(num, 10) + 10000)).slice(1);
};

/** Turns each segment of a semver number into a left-padded number */
const semverToSortString = (str: string): string =>
  str.split('.').map(padNum).join('.');

/** Sorts SauceBase objects by semver */
const semverSort = (a: string, b: string) =>
  semverToSortString(a).localeCompare(semverToSortString(b));

const sauceDataFile = path.join(__dirname, 'saucelabs-data.json');

export function getCustomLaunchers(): Record<string, Launcher> {
  invariant(fs.existsSync(sauceDataFile), 'Sauce data file does not exist');
  const sauceData: AppiumDevice[] = JSON.parse(
    fs.readFileSync(sauceDataFile, 'utf8')
  );
  invariant(Array.isArray(sauceData), 'Sauce data is not an array');
  invariant(sauceData.length > 10, 'Sauce data is incomplete');

  const dataByApiName = groupBy(sauceData, 'api_name');

  const devices = flattenDeep<AppiumDevice>(
    Object.keys(dataByApiName).map((apiName) => {
      const groupedByOsVersion = groupBy(
        dataByApiName[apiName],
        'short_version'
      );

      const osVersions = Object.keys(groupedByOsVersion)
        .filter((f) => !isNaN(parseInt(f, 10)))
        .sort(semverSort)
        // reversing so that uniqBy sees the largest number first
        .reverse();
      const latestOSVersions = uniqBy(osVersions, (v) => parseInt(v, 10));

      const sauceObjs = latestOSVersions
        .slice(0, 4)
        .map((v) => sample(groupedByOsVersion[v])!);

      return sauceObjs;
    })
  );

  const customLaunchers: Record<string, Launcher> = {};

  // mobile devices
  devices.forEach((data) => {
    const key = `sl_${data.api_name}_${data.short_version}`;

    // make sure there aren't any key collisions
    invariant(
      !customLaunchers[key],
      'Key `%s` already exists in customLaunchers',
      key
    );

    let browserName: string;
    if (data.api_name === 'iphone') {
      browserName = 'Safari';
    } else if (data.api_name === 'android') {
      const androidVersion = parseInt(data.short_version, 10);
      if (androidVersion < 6) {
        browserName = 'Browser';
      } else {
        browserName = 'Chrome';
      }
    } else {
      return;
    }

    customLaunchers[key] = {
      // recommended_backend_version can be an empty string
      appiumVersion:
        data.recommended_backend_version ||
        data.supported_backend_versions.slice(-1)[0],
      base: 'SauceLabs',
      browserName,
      deviceName: data.long_name,
      name: `${data.long_name} ${data.short_version}`,
      platformName: mobilePlatforms[data.api_name] || data.long_name,
      platformVersion: data.short_version,
    };
  });

  // IE 9-11
  [11, 10, 9].forEach((v) => {
    customLaunchers[`sl_ie_${v}`] = {
      base: 'SauceLabs',
      browserName: 'Internet Explorer',
      name: `Internet Explorer ${v}`,
      version: '' + v,
    };
  });

  // browsers that support the `latest` field
  ['MicrosoftEdge', 'Safari', 'Firefox', 'Chrome'].forEach((b) => {
    const niceName = b === 'MicrosoftEdge' ? 'Edge' : b;
    for (let idx = -1; ++idx < 4; ) {
      const k = `sl_${b}_latest${idx > 0 ? `-${idx}` : ''}`.toLowerCase();
      const version = `latest${idx > 0 ? `-${idx}` : ''}`;
      let platform: string | undefined;
      if (b !== 'Safari') {
        platform = 'Windows 10';
      }

      customLaunchers[k] = {
        base: 'SauceLabs',
        browserName: b,
        name: `${niceName} ${version}`,
        platform,
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

  return customLaunchers;
}
