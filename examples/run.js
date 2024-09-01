// @ts-check

const { getPackages } = require('@manypkg/get-packages');
const { spawn } = require('node:child_process');
const inquirer = require('inquirer');
const path = require('node:path');

const JSXSTYLE_ROOT = path.resolve(__dirname, '..');

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
  const { packages } = await getPackages(JSXSTYLE_ROOT);
  const examplePkgs = packages.filter((f) =>
    f.packageJson.name.endsWith('-example')
  );
  const choices = examplePkgs.map((pkg) => ({
    name: pkg.packageJson.name,
    value: pkg.packageJson.name,
  }));

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
  }
  const examplePkg = examplePkgs.find((pkg) =>
    pkg.packageJson.name.includes(searchString)
  );
  if (!examplePkg) {
    throw new Error(`Could not find example matching "${searchString}"`);
  }
  return npmCommand(examplePkg.packageJson.name, 'start');
})(process.argv.slice(2).join(' ')).catch(console.error);
