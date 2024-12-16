import { $, question, argv } from 'zx';
import { getWorkspaces } from '@jsxstyle/internal';

const workspaces = await getWorkspaces();

const searchString = argv._.join(' ');

const examplePkgs = workspaces
  .filter((f) => f.name.endsWith('-example'))
  .map((pkg, index) => ({
    id: (index + 1).toString(),
    name: pkg.name,
  }));

const choices = examplePkgs.map((pkg) => pkg.id);

if (choices.length === 0) {
  throw new Error('No examples found');
}

if (!searchString) {
  console.log('Available examples:');
  console.log(examplePkgs.map((c, i) => `${i + 1}. ${c.name}`).join('\n'));
  const answer = await question('Pick an example: ', { choices });
  const examplePkg = examplePkgs.find((pkg) => pkg.id === answer);
  if (!examplePkg) {
    throw new Error(`Could not find example matching "${answer}"`);
  }
  $`npm run -w ${examplePkg.name} start`;
} else {
  const examplePkg = examplePkgs.find((pkg) => pkg.name.includes(searchString));
  if (!examplePkg) {
    throw new Error(`Could not find example matching "${searchString}"`);
  }
  $`npm run -w ${examplePkg.name} start`;
}
