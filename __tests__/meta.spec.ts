import fs = require('fs');
import packlist = require('npm-packlist');
import path = require('path');
import glob = require('glob');
import { execSync } from 'child_process';
import { getPackages } from '@manypkg/get-packages';

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
    const packages = await getPackages(JSXSTYLE_ROOT);
    const packagePromises = packages.packages
      // exclude private packages
      .filter((pkg) => !pkg.packageJson.private)
      .sort((a, b) => a.packageJson.name.localeCompare(b.packageJson.name))
      .map((pkg) =>
        // fetch file list and format it into something
        packlist({ path: pkg.dir }).then(
          (fileList) => `
${pkg.packageJson.name}
${pkg.packageJson.name.replace(/./g, '=')}
${fileList
  .sort(legacySort)
  .map((f) => `- ${f}`)
  .join('\n')}
`
        )
      );

    await expect(Promise.all(packagePromises)).resolves.toMatchSnapshot();
  });
});

describe('yarn.lock', () => {
  it('does not contain Twitter-internal URLs', async () => {
    const lockfileContents = fs.readFileSync(
      path.resolve(__dirname, '../yarn.lock'),
      'utf8'
    );
    expect(lockfileContents.includes('twitter.biz')).toEqual(false);
  });
});

const skippedExamples = ['preact-cli', 'preact-cli-typescript'].map(
  (name) => `jsxstyle-${name}-example`
);

describe('examples', () => {
  const exampleDir = path.resolve(__dirname, '..', 'examples');
  const examples = glob.sync('jsxstyle-*-example', { cwd: exampleDir });

  for (const example of examples) {
    // TODO(meyer) re-enable when this error is fixed: https://github.com/preactjs/preact-cli/issues/1043
    const itFn = skippedExamples.includes(example) ? it.skip : it;

    itFn(
      `\`${example}\` builds correctly`,
      async () => {
        const cwd = path.join(exampleDir, example);
        expect.assertions(1);
        return expect(() =>
          execSync('yarn build', { cwd, stdio: 'inherit' }).toString('utf-8')
        ).not.toThrow();
      },
      30000
    );
  }
});
