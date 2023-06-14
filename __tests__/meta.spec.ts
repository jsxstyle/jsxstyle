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
  .map((fileName) => {
    // chunk filenames contain a hash that will change across builds
    const updatedFileName = fileName.replace(
      /(\.)[a-f0-9]{8}(\.c?js(?:\.map)?)$/,
      '$1[hash]$2'
    );
    return `- ${updatedFileName}`;
  })
  .sort()
  .join('\n')}
`
        )
      );

    await expect(Promise.all(packagePromises)).resolves.toMatchSnapshot();
  });
});

describe.skip('examples', () => {
  const exampleDir = path.resolve(__dirname, '..', 'examples');
  const examples = glob.sync('jsxstyle-*-example', { cwd: exampleDir });

  for (const example of examples) {
    it(`\`${example}\` builds correctly`, async () => {
      const cwd = path.join(exampleDir, example);
      expect.assertions(1);
      return expect(() =>
        execSync('npm run build', { cwd, stdio: 'inherit' })
      ).not.toThrow();
    }, 30000);
  }
});
