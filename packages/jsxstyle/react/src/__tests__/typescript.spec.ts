import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

it('throws type errors for invalid component/prop types', async () => {
  const report = await execAsync('npx tsc', { cwd: __dirname });
  expect(report.stderr).toEqual('');
  expect(report.stdout).toEqual('');
});
