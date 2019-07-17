import { getPackages } from '@lerna/project';
import fs = require('fs');
import packlist = require('npm-packlist');
import path = require('path');

// NOTE: this interface is incomplete
// See: @lerna/package
interface Package {
  name: string;
  location: string;
  private: boolean;
  toJSON: () => string;
}

const JSXSTYLE_ROOT = path.resolve(__dirname, '..');

// https://github.com/npm/npm-packlist/commit/63d1e3ee9c2e23ac87496ca78d3183f0652c531c
const legacySort = (a: string, b: string) =>
  // extname, then basename, then locale alphabetically
  a === 'package.json'
    ? -1
    : b === 'package.json'
    ? 1
    : /^node_modules/.test(a) && !/^node_modules/.test(b)
    ? 1
    : /^node_modules/.test(b) && !/^node_modules/.test(a)
    ? -1
    : path.dirname(a) === '.' && path.dirname(b) !== '.'
    ? -1
    : path.dirname(b) === '.' && path.dirname(a) !== '.'
    ? 1
    : a.localeCompare(b);

describe('npm publish', () => {
  it('only publishes the intended files', async () => {
    const packages: Package[] = await getPackages(JSXSTYLE_ROOT);
    const packagePromises = packages
      // exclude private packages
      .filter(pkg => !pkg.private)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(pkg =>
        // fetch file list and format it into something
        packlist({ path: pkg.location }).then(
          fileList => `
${pkg.name}
${pkg.name.replace(/./g, '=')}
${fileList
  .sort(legacySort)
  .map(f => `- ${f}`)
  .join('\n')}
`
        )
      );

    await expect(Promise.all(packagePromises)).resolves.toMatchSnapshot();
  });
});

describe('yarn.lock', () => {
  it('does not contain Twitter-internal URLs', async () => {
    const lockfileContents = fs.readFileSync('../yarn.lock', 'utf8');
    expect(lockfileContents.includes('twitter.biz')).toEqual(false);
  });
});
