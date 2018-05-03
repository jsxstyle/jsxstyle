import { spawn } from 'child_process';
import * as fs from 'fs';
import * as inquirer from 'inquirer';
import * as path from 'path';

fs.readdir(__dirname, async (err, filenames) => {
  const exampleDirs = filenames.filter(f => {
    if (f === 'node_modules') {
      return false;
    }
    return fs.lstatSync(path.join(__dirname, f)).isDirectory();
  });

  const { example } = await inquirer.prompt([
    {
      choices: exampleDirs.map(pkg => ({ name: pkg, value: pkg })),
      message: 'Pick an example',
      name: 'example',
      type: 'list',
    },
  ]);

  const cmd = spawn('npm', ['--prefix', example, 'start'], {
    cwd: __dirname,
    stdio: 'inherit',
  });

  process.on('SIGINT', () => {
    cmd.kill('SIGINT');
    process.exit();
  });
});
