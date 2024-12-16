import { getPackList, getWorkspaces } from '@jsxstyle/internal';
import * as path from 'node:path';
import { glob, $ } from 'zx';

describe('npm publish', () => {
  it('only publishes the intended files', async () => {
    const packages = await getWorkspaces();

    const packLists = await getPackList(
      packages.filter((pkg) => !pkg.private).map((pkg) => pkg.name)
    );

    // exclude private packages
    const results = packLists
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(
        (pkg) =>
          `
${pkg.name}
${pkg.name.replace(/./g, '=')}
${pkg.files
  .map(({ path }) => {
    // chunk filenames contain a hash that will change across builds
    const updatedFileName = path.replace(
      /(\.)[a-f0-9]{8}(\.c?js(?:\.map)?)$/,
      '$1[hash]$2'
    );
    return `- ${updatedFileName}`;
  })
  .sort()
  .join('\n')}
`
      );

    await expect(results).toMatchSnapshot();
  });
});

describe.skip('examples', async () => {
  const exampleDir = path.resolve(__dirname, '..', 'examples');
  const examples = await glob('jsxstyle-*-example', { cwd: exampleDir });

  for (const example of examples) {
    it(`\`${example}\` builds correctly`, async () => {
      const cwd = path.join(exampleDir, example);
      expect.assertions(1);
      return expect(() => $({ cwd })`npm run build`).not.toThrow();
    }, 30000);
  }
});
