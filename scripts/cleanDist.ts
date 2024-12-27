import { fs, path } from 'zx';
import { getWorkspaces } from '@jsxstyle/internal';

const workspaces = await getWorkspaces();

for (const workspace of workspaces) {
  await fs.rm(path.join(workspace.path, 'lib'), {
    recursive: true,
    force: true,
  });
  await fs.rm(path.join(workspace.path, 'dist'), {
    recursive: true,
    force: true,
  });
  await fs.rm(path.join(workspace.path, 'build'), {
    recursive: true,
    force: true,
  });
}
