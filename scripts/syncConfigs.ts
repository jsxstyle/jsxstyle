import { schemas, sortPackageJson, sortTsconfig } from '@jsxstyle/internal';
import { getPackages } from '@manypkg/get-packages';
import * as s from 'superstruct';
import { fs, path, glob } from 'zx';

const getPathBuilder = (relativeDir: string) => (projectPath: string) => {
  const relativePath = path.relative(relativeDir, projectPath);
  return {
    path: relativePath.startsWith('.') ? relativePath : `./${relativePath}`,
  };
};

const workspaces = await getPackages(process.cwd());

const typeScriptProjects: string[] = [];
const publicProjectPaths: string[] = [];
const publicProjectNames: string[] = [];
const projectPathsByName: Record<string, string> = {};

for (const {
  relativeDir,
  packageJson: { name, private: isPrivate },
} of workspaces.packages) {
  if (name === '@jsxstyle/internal') continue;
  projectPathsByName[name] = relativeDir;

  const hasTsConfig = await fs.exists(`${relativeDir}/tsconfig.json`);
  if (!hasTsConfig) continue;

  typeScriptProjects.push(relativeDir);
  if (!isPrivate && name !== '@jsxstyle/astro') {
    publicProjectPaths.push(relativeDir);
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

    if (
      !tsconfig.extends ||
      !tsconfig.extends.startsWith('@jsxstyle/internal/')
    ) {
      throw new Error(
        'Non-standard `tsconfig.extends` value in "' + projectPath + '"'
      );
    }

    tsconfig.include = undefined;
    tsconfig.exclude = undefined;
    tsconfig.compilerOptions = {
      types: tsconfig.compilerOptions?.types,
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
        .filter((dep) => dep !== projectPath)
        .map(pathBuilder);

      const isNotAPackage = !projectPath.startsWith('packages/');
      if (isNotAPackage) {
        tsconfig.compilerOptions.baseUrl = '.';
      } else {
        tsconfig.compilerOptions.baseUrl = undefined;
      }

      tsconfig.compilerOptions.paths = {
        ...(isNotAPackage ? { '~/*': ['./src/*'] } : null),
        ...Object.fromEntries(
          knownDependencies.map((dep) => {
            const srcDir = path.join(pathBuilder(dep.path).path, 'src');
            return [
              dep.name,
              [srcDir.startsWith('.') ? srcDir : `./${srcDir}`],
            ];
          })
        ),
      };
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
