import invariant from 'invariant';
import * as s from 'superstruct';
import { $, spinner, tmpdir } from 'zx';
import {
  pnpmPackSchema,
  type PnpmWorkspace,
  workspacesSchema,
} from './schemas.js';

export const getWorkspaces = async () => {
  const workspaces = await spinner('Getting workspaces…', () =>
    $`pnpm list -r --json`.json()
  );
  s.assert(workspaces, workspacesSchema);
  return workspaces.filter(({ name }) => {
    // internal packages doesn't need to be standardised
    return name !== '@jsxstyle/internal';
  });
};

export const getPackList = async (workspace: PnpmWorkspace) => {
  const fileList = await spinner(`Packing ${workspace.name}…`, () =>
    $({
      cwd: workspace.path,
    })`pnpm pack --json --pack-destination=${tmpdir(workspace.name)}`.json()
  );
  s.assert(fileList, pnpmPackSchema);
  return fileList;
};

export const sortObj = <T>(obj: T, customSort: string[]): T => {
  if (typeof obj !== 'object' || obj == null) return obj;

  // @ts-expect-error
  return Object.fromEntries(
    Object.entries(obj)
      .filter(([_key, value]) => value !== undefined)
      .sort(([a], [b]) => {
        const aIndex = customSort.indexOf(a);
        const bIndex = customSort.indexOf(b);
        invariant(aIndex > -1, 'Key `%s` not found in customSort', a);
        invariant(bIndex > -1, 'Key `%s` not found in customSort', b);
        return aIndex - bIndex;
      })
  );
};

const packageJsonKeys = [
  'name',
  'private',
  'version',
  'type',
  'description',
  'keywords',
  'homepage',
  'bugs',
  'repository',
  'license',
  'author',
  'contributors',
  'files',
  'main',
  'types',
  'exports',
  'scripts',
  'dependencies',
  'devDependencies',
  'peerDependencies',
];

export const sortPackageJson = (
  value: Record<string, unknown>
): Record<string, unknown> => {
  return sortObj(value, packageJsonKeys);
};

const tsconfigKeys = [
  '$schema',
  'extends',
  'files',
  'include',
  'exclude',
  'compilerOptions',
  'references',
];

const compilerOptionsKeys = [
  'composite',
  'target',
  'module',
  'moduleResolution',
  'jsx',
  'jsxImportSource',
  'jsxFactory',
  'jsxFragmentFactory',
  'lib',
  'types',
  'rootDir',
  'outDir',
  'tsBuildInfoFile',
  'allowJs',
  'allowSyntheticDefaultImports',
  'allowUnreachableCode',
  'allowUnusedLabels',
  'alwaysStrict',
  'declaration',
  'sourceMap',
  'declarationMap',
  'downlevelIteration',
  'esModuleInterop',
  'forceConsistentCasingInFileNames',
  'importHelpers',
  'isolatedModules',
  'noEmit',
  'noEmitHelpers',
  'noEmitOnError',
  'noFallthroughCasesInSwitch',
  'noImplicitAny',
  'noImplicitReturns',
  'noImplicitThis',
  'noPropertyAccessFromIndexSignature',
  'noUncheckedIndexedAccess',
  'noUnusedLocals',
  'noUnusedParameters',
  'resolveJsonModule',
  'skipLibCheck',
  'strict',
  'strictBindCallApply',
  'strictFunctionTypes',
  'strictNullChecks',
  'strictPropertyInitialization',
  'plugins',
  'paths',
];

const sortCompilerOptions = (value: unknown): unknown => {
  return sortObj(value, compilerOptionsKeys);
};

export const sortTsconfig = ({
  compilerOptions,
  ...value
}: Record<string, unknown>): Record<string, unknown> => {
  return sortObj(
    {
      ...value,
      compilerOptions: sortCompilerOptions(compilerOptions),
    },
    tsconfigKeys
  );
};
