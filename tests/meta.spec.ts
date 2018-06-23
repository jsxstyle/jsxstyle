import * as PackageUtilities from 'lerna/lib/PackageUtilities';
import * as Repository from 'lerna/lib/Repository';
import * as packlist from 'npm-packlist';
import * as path from 'path';
import { Dict } from '../packages/jsxstyle-utils';

interface Package {
  /** parsed contents of the package's package.json file */
  _package: {
    name: string;
    private?: true;
    version?: string;
    main?: string;
    scripts?: Dict<string>;
    devDependencies?: Dict<string>;
    dependencies?: Dict<string>;
  };
  /** absolute path to the package */
  _location: string;
}

// get all packages from Lerna
const JSXSTYLE_ROOT = path.resolve(__dirname, '..');
const repo = new Repository(JSXSTYLE_ROOT);
const packages: Package[] = PackageUtilities.getPackages(repo);
packages.sort((a, b) => a._package.name.localeCompare(b._package.name));

describe('npm publish', () => {
  it('only publishes the intended files', async () => {
    const pkgPromises = Promise.all(
      packages.map(async pkg => {
        const fileList = await packlist({ path: pkg._location });
        return `
${pkg._package.name}
${pkg._package.name.replace(/./g, '=')}
${fileList.map(f => `- ${f}`).join('\n')}
`;
      })
    );

    await expect(pkgPromises).resolves.toMatchSnapshot();
  });
});
