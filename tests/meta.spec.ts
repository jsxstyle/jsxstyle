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
${fileList.map(f => `- ${f}`).join('\n')}
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
