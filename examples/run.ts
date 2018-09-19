import { getPackages } from '@lerna/project';
import { spawn } from 'child_process';
import * as inquirer from 'inquirer';
import * as path from 'path';

// NOTE: this interface is incomplete
// See: @lerna/package
interface Package {
  name: string;
  location: string;
  private: boolean;
  toJSON: () => string;
}

const JSXSTYLE_ROOT = path.resolve(__dirname, '..');

// TODO: use @lerna/run
const npmCommand = (example: string, ...args: string[]) =>
  new Promise<void>((resolve, reject) => {
    const childProcess = spawn('npm', args, {
      cwd: path.resolve(__dirname, example),
      stdio: 'inherit',
    });

    process.on('SIGINT', () => {
      childProcess.kill('SIGINT');
      process.exit();
    });

    childProcess.on('close', code => {
      if (code === 0) {
        resolve();
      } else {
        reject(
          `\`npm --prefix ${example} ${args.join(' ')}\`` +
            ` exited with a non-zero code (${code})`
        );
      }
    });
  });

(async searchString => {
  const packages: Package[] = await getPackages(JSXSTYLE_ROOT);
  const examplePkgs = packages.filter(f => f.name.endsWith('-example'));
  const choices = examplePkgs.map(pkg => ({ name: pkg.name, value: pkg.name }));

  if (!searchString) {
    const { example } = await inquirer.prompt([
      {
        choices,
        message: 'Pick an example',
        name: 'example',
        type: 'list',
      },
    ]);
    return npmCommand(example, 'start');
  } else {
    const examplePkg = examplePkgs.find(pkg => pkg.name.includes(searchString));
    if (!examplePkg) {
      throw new Error('Could not find example matching "' + searchString + '"');
    }
    return npmCommand(examplePkg.name, 'start');
  }
})
  .apply(null, process.argv.slice(2))
  .catch(console.error);
