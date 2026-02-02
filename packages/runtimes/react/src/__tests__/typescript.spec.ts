import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

it('throws type errors for invalid component/prop types', async () => {
  const report = await execAsync('pnpm exec tsc', { cwd: __dirname });
  expect(report.stderr).toEqual('');
  expect(report.stdout).toEqual('');
});
