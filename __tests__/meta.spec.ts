import fs from 'fs';
import packlist from 'npm-packlist';
import path from 'path';
import glob from 'glob';
import { execSync } from 'child_process';
import { getPackages } from '@manypkg/get-packages';

const JSXSTYLE_ROOT = path.resolve(__dirname, '..');

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
  .sort()
  .map((fileName) => {
    // chunk filenames contain a hash that will change across builds
    const updatedFileName = fileName.replace(
      /(\.)[a-f0-9]{8}(\.(?:e|cj)s\.js(?:\.map)?)$/,
      '$1[hash]$2'
    );
    return `- ${updatedFileName}`;
  })
  .join('\n')}
`
        )
      );

    await expect(Promise.all(packagePromises)).resolves.toMatchSnapshot();
  });
});

describe('lockfile', () => {
  it('does not contain Twitter-internal URLs', async () => {
    const lockfileContents = fs.readFileSync(
      path.resolve(__dirname, '../package-lock.json'),
      'utf8'
    );
    expect(lockfileContents.includes('twitter.biz')).toEqual(false);
  });
});

const skippedExamples = ['preact-cli', 'preact-cli-typescript', 'gatsby'].map(
  (name) => `jsxstyle-${name}-example`
);

describe('examples', () => {
  const exampleDir = path.resolve(__dirname, '..', 'examples');
  const examples = glob.sync('jsxstyle-*-example', { cwd: exampleDir });

  for (const example of examples) {
    // TODO(meyer) re-enable when this error is fixed: https://github.com/preactjs/preact-cli/issues/1043
    const itFn = skippedExamples.includes(example) ? it.skip : it;

    /* eslint jest/no-standalone-expect: ['error', { additionalTestBlockFunctions: ['itFn'] }] */
    itFn(
      `\`${example}\` builds correctly`,
      async () => {
        const cwd = path.join(exampleDir, example);
        expect.assertions(1);
        return expect(() =>
          execSync('npm run build', { cwd, stdio: 'inherit' })
        ).not.toThrow();
      },
      30000
    );
  }
});
