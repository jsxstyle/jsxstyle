import { fs, path } from 'zx';
import { getWorkspaces } from '../packages/internal/src/utils.js';

const workspaces = await getWorkspaces();

for (const workspace of workspaces) {
  await fs.rm(path.join(workspace.realpath, 'lib'), {
    recursive: true,
    force: true,
  });
  await fs.rm(path.join(workspace.realpath, 'dist'), {
    recursive: true,
    force: true,
  });
  await fs.rm(path.join(workspace.realpath, 'build'), {
    recursive: true,
    force: true,
  });
}
