import { Dict } from 'jsxstyle-utils';
import * as PackageUtilities from 'lerna/lib/PackageUtilities';
import * as Repository from 'lerna/lib/Repository';
import * as packlist from 'npm-packlist';
import * as path from 'path';

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

// separate private and public packages
const privatePackages = packages.filter(pkg => pkg._package.private);
const publicPackages = packages.filter(pkg => !pkg._package.private);

describe('jest', () => {
  it('picks the right packages', () => {
    expect.assertions(publicPackages.length + 1);
    let resolvedPaths = '\n';
    const maxPkgNameLen = Math.max(
      ...publicPackages.map(pkg => pkg._package.name.length)
    );

    publicPackages.forEach(pkg => {
      const { name } = pkg._package;
      const pkgPath = require.resolve(pkg._location);
      const resolvedPath = require.resolve(name);
      const relativePath = path.relative(JSXSTYLE_ROOT, pkgPath);
      const pad = ' '.repeat(maxPkgNameLen - name.length);
      resolvedPaths += `${name}${pad} --> ${relativePath}\n`;
      expect(pkgPath).toBe(resolvedPath);
    });

    expect(resolvedPaths).toMatchSnapshot();
  });
});

describe('npm publish', () => {
  it('only publishes the intended files', async () => {
    const privatePackageNames = privatePackages.map(pkg => pkg._package.name);
    expect(privatePackageNames).toMatchSnapshot('private packages');

    const pkgPromises = Promise.all(
      publicPackages.map(async pkg => {
        const fileList = await packlist({ path: pkg._location });
        return `
${pkg._package.name}
${pkg._package.name.replace(/./g, '=')}
${fileList.map(f => `- ${f}`).join('\n')}
`;
      })
    );

    await expect(pkgPromises).resolves.toMatchSnapshot('public packages');
  });
});
