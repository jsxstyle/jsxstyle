import * as s from 'superstruct';
import { fs, path, glob } from 'zx';
import {
  schemas,
  getWorkspaces,
  sortPackageJson,
  sortTsconfig,
} from '@jsxstyle/internal';

const getPathBuilder = (relativeDir: string) => (projectPath: string) => {
  const relativePath = path.relative(relativeDir, projectPath);
  return {
    path: relativePath.startsWith('.') ? relativePath : `./${relativePath}`,
  };
};

const workspaces = await getWorkspaces();

const typeScriptProjects: string[] = [];
const publicProjectPaths: string[] = [];
const publicProjectNames: string[] = [];
const projectPathsByName: Record<string, string> = {};

for (const { name, private: isPrivate, path: realpath } of workspaces) {
  const relativePath = path.relative(process.cwd(), realpath);

  projectPathsByName[name] = relativePath;

  const hasTsConfig = await fs.exists(`${relativePath}/tsconfig.json`);
  if (!hasTsConfig) continue;

  typeScriptProjects.push(relativePath);
  if (!isPrivate && name !== '@jsxstyle/astro') {
    publicProjectPaths.push(relativePath);
    publicProjectNames.push(name);
  }
}

for (const projectPath of typeScriptProjects) {
  const packageJson = await fs.readJson(`${projectPath}/package.json`);
  s.assert(packageJson, schemas.packageJsonSchema);

  const tsconfig = await fs.readJson(`${projectPath}/tsconfig.json`);
  s.assert(tsconfig, schemas.tsconfigSchema);

  if (packageJson.name !== '@jsxstyle/astro') {
    const knownDependencies = Array.from(
      new Set([
        ...Object.keys(packageJson.dependencies ?? {}),
        ...Object.keys(packageJson.devDependencies ?? {}),
        ...Object.keys(packageJson.peerDependencies ?? {}),
      ])
    )
      .map((dep) => {
        const depPath = projectPathsByName[dep];
        if (!depPath) return null;
        return {
          name: dep,
          path: depPath,
        };
      })
      .filter(
        <T extends { name: string }>(dep: T | null): dep is T =>
          !!(dep && projectPathsByName[dep.name])
      )
      .sort();

    if (projectPath.startsWith('examples/') || projectPath === 'minisite') {
      tsconfig.extends = '@jsxstyle/internal/tsconfig.react.json';
    } else if (projectPath.startsWith('packages/runtimes/')) {
      tsconfig.extends = '@jsxstyle/internal/tsconfig.browser.json';
    } else if (packageJson.type === 'module') {
      tsconfig.extends = '@jsxstyle/internal/tsconfig.esm.json';
    } else {
      tsconfig.extends = '@jsxstyle/internal/tsconfig.cjs.json';
    }

    tsconfig.include = undefined;
    tsconfig.exclude = undefined;
    tsconfig.compilerOptions = {
      jsx: tsconfig.compilerOptions?.jsx,
      jsxImportSource: tsconfig.compilerOptions?.jsxImportSource,
      jsxFactory: tsconfig.compilerOptions?.jsxFactory,
    };

    if (knownDependencies.length === 0) {
      tsconfig.references = undefined;
      tsconfig.compilerOptions.paths = undefined;
      if (JSON.stringify(tsconfig.compilerOptions) === '{}') {
        tsconfig.compilerOptions = undefined;
      }
    } else {
      const pathBuilder = getPathBuilder(projectPath);

      tsconfig.references = knownDependencies
        .map((dep) => dep.path)
        .map(pathBuilder);

      tsconfig.compilerOptions.paths = Object.fromEntries(
        knownDependencies.map((dep) => [
          dep.name,
          [path.join(pathBuilder(dep.path).path, 'src')],
        ])
      );
    }

    if (publicProjectPaths.includes(projectPath)) {
      packageJson.main = 'lib/index.js';
      packageJson.module = undefined;
      packageJson.types = 'lib/index.d.ts';
      packageJson.files = ['lib', '!lib/tsconfig.tsbuildinfo'];
    } else {
      packageJson.main = undefined;
      packageJson.module = undefined;
      packageJson.types = undefined;
      packageJson.files = undefined;
    }
  }

  await fs.writeJson(`${projectPath}/tsconfig.json`, sortTsconfig(tsconfig), {
    spaces: 2,
  });

  await fs.writeJson(
    `${projectPath}/package.json`,
    sortPackageJson(packageJson),
    { spaces: 2 }
  );
}

await fs.writeJson(
  'tsconfig.json',
  {
    files: [],
    references: [
      {
        path: './tsconfig.test.json',
      },
      {
        path: './scripts/tsconfig.json',
      },
      {
        path: './packages/internal/tsconfig.json',
      },
      ...typeScriptProjects.sort().map(getPathBuilder(process.cwd())),
    ],
  },
  { spaces: 2 }
);

await fs.writeJson(
  'tsconfig.build.json',
  {
    files: [],
    references: publicProjectPaths.sort().map(getPathBuilder(process.cwd())),
  },
  { spaces: 2 }
);

const testTsconfig = await fs.readJson('tsconfig.test.json');
s.assert(testTsconfig, schemas.tsconfigSchema);

testTsconfig.references = publicProjectPaths
  .sort()
  .map(getPathBuilder(process.cwd()));

await fs.writeJson('tsconfig.test.json', sortTsconfig(testTsconfig), {
  spaces: 2,
});

const tsconfigFiles = await glob('packages/internal/tsconfig.*.json');
for (const filePath of tsconfigFiles) {
  const tsconfig = await fs.readJson(filePath);
  s.assert(tsconfig, schemas.tsconfigSchema);
  await fs.writeJson(filePath, sortTsconfig(tsconfig), { spaces: 2 });
}
