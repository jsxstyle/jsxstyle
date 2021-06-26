// @ts-check

const { getPackages } = require('@lerna/project');
const { spawn } = require('child_process');
const inquirer = require('inquirer');
const path = require('path');

// NOTE: this interface is incomplete
// See: @lerna/package
/**
 * @typedef {{ name: string; location: string; private: boolean; toJSON: () => string; }} Package
 */

const JSXSTYLE_ROOT = path.resolve(__dirname, '..');

// TODO: use @lerna/run
/** @type {(example: string, ...args: any[]) => Promise<void>} */
const npmCommand = (example, ...args) =>
  new Promise((resolve, reject) => {
    const childProcess = spawn('npm', args, {
      cwd: path.resolve(__dirname, example),
      stdio: 'inherit',
    });

    process.on('SIGINT', () => {
      childProcess.kill('SIGINT');
      process.exit();
    });

    childProcess.on('close', (code) => {
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

(async (searchString) => {
  const packages = await getPackages(JSXSTYLE_ROOT);
  const examplePkgs = packages.filter((f) => f.name.endsWith('-example'));
  const choices = examplePkgs.map((pkg) => ({
    name: pkg.name,
    value: pkg.name,
  }));

  console.log({});

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
    const examplePkg = examplePkgs.find((pkg) =>
      pkg.name.includes(searchString)
    );
    if (!examplePkg) {
      throw new Error('Could not find example matching "' + searchString + '"');
    }
    return npmCommand(examplePkg.name, 'start');
  }
})(process.argv.slice(2).join(' ')).catch(console.error);
