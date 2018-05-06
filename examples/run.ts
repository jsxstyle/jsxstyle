import { spawn } from 'child_process';
import * as fs from 'fs-extra';
import * as inquirer from 'inquirer';
import * as path from 'path';

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

(async (command, ...args) => {
  const filenames = await fs.readdir(__dirname);
  const exampleDirs = filenames.filter(f => {
    if (f === 'node_modules') {
      return false;
    }
    return fs.lstatSync(path.join(__dirname, f)).isDirectory();
  });

  if (command === 'init') {
    for (const dir of exampleDirs) {
      await npmCommand(dir, '--silent', 'install');
      console.info('installed dependencies for %s', dir);
    }
  } else if (command === 'reset') {
    for (const dir of exampleDirs) {
      await fs.remove(path.join(__dirname, dir, 'node_modules'));
      console.info('deleted node_modules for %s', dir);
    }
  } else if (!command) {
    const { example } = await inquirer.prompt([
      {
        choices: exampleDirs.map(name => ({ name, value: name })),
        message: 'Pick an example',
        name: 'example',
        type: 'list',
      },
    ]);
    return npmCommand(example, 'start');
  } else {
    throw new Error('Unsupported command: ' + command);
  }
})
  .apply(null, process.argv.slice(2))
  .catch(console.error);
