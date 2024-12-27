import { getPackList, getWorkspaces } from '@jsxstyle/internal';
import * as path from 'node:path';
import { glob, $ } from 'zx';

describe('npm publish', async () => {
  const packages = await getWorkspaces().then((pkgs) =>
    pkgs.filter((pkg) => !pkg.private)
  );

  it.for(packages)('$name only publishes the intended files', async (pkg) => {
    const packlist = await getPackList(pkg);
    expect(`
${packlist.name}
${packlist.name.replace(/./g, '=')}
${packlist.files
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
`).toMatchSnapshot();
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
