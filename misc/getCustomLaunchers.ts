import invariant from 'invariant';
import { flattenDeep, groupBy, sample, uniqBy } from 'lodash';

const mobilePlatforms = {
  android: 'Android',
  iphone: 'iOS',
};

export interface LauncherBase {
  base: 'SauceLabs';
  browserName: string;
  testName?: string;
}

export interface WebdriverLauncher extends LauncherBase {
  browserVersion: string;
  platformName?: string;
}

export interface AppiumLauncher extends LauncherBase {
  appiumVersion: string;
  browserName: string;
  deviceName: string;
  platformName?: string;
  platformVersion?: string;
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

import sauceData from './saucelabs-data.json';

export function getCustomLaunchers(): Record<string, Launcher> {
  invariant(Array.isArray(sauceData), 'Sauce data is not an array');
  invariant(sauceData.length > 10, 'Sauce data is incomplete');

  const dataByApiName = groupBy(sauceData, 'api_name');

  const devices = flattenDeep(
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

    if (data.api_name !== 'android') {
      return;
    }

    let browserName: string;

    const androidVersion = parseInt(data.short_version, 10);
    if (androidVersion < 6) {
      browserName = 'Browser';
    } else {
      browserName = 'Chrome';
    }

    customLaunchers[key] = {
      // recommended_backend_version can be an empty string
      appiumVersion:
        data.recommended_backend_version ||
        data.supported_backend_versions.slice(-1)[0],
      base: 'SauceLabs',
      browserName,
      deviceName: data.long_name,
      platformName:
        mobilePlatforms[data.api_name] ||
        `${data.long_name} ${data.short_version}`,
      platformVersion: data.short_version,
    };
  });

  // // IE 9-11
  // [11, 10, 9].forEach((v) => {
  //   customLaunchers[`sl_ie_${v}`] = {
  //     base: 'SauceLabs',
  //     browserName: 'Internet Explorer',
  //     browserVersion: '' + v,
  //   };
  // });

  // browsers that support the `latest` field
  ['MicrosoftEdge', 'Safari', 'Firefox', 'Chrome', 'iPhone'].forEach(
    (browserName) => {
      for (let idx = -1; ++idx < 2; ) {
        const k = `sl_${browserName}_latest${
          idx > 0 ? `-${idx}` : ''
        }`.toLowerCase();
        const browserVersion = `latest${idx > 0 ? `-${idx}` : ''}`;
        let platformName: string | undefined;
        if (browserName !== 'Safari') {
          platformName = 'Windows 10';
        }

        customLaunchers[k] = {
          base: 'SauceLabs',
          browserName: browserName,
          platformName,
          browserVersion,
        };
      }
    }
  );

  const tzOffset = new Date().getTimezoneOffset();
  const [dateString, timeString] = new Date(Date.now() - tzOffset * 60000)
    .toISOString()
    .split(/[T.]/);
  const when = ` @ ${dateString} ${timeString} GMT${-tzOffset / 60}: `;

  for (const launcherName in customLaunchers) {
    customLaunchers[launcherName].testName =
      +when + customLaunchers[launcherName].testName;
  }

  return customLaunchers;
}
