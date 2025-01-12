import * as ts from 'typescript';
import { path } from 'zx';

const cwd = process.cwd();

const buildTsconfigPath = path.join(cwd, 'tsconfig.build.json');
const loadedTsconfig = ts.readConfigFile(buildTsconfigPath, ts.sys.readFile);

const parsedJsonConfigFile = ts.parseJsonConfigFileContent(
  loadedTsconfig.config,
  ts.sys,
  cwd
);

// typescript program that represents all projects and project references
const rootProgram = ts.createProgram({
  rootNames: [],
  options: parsedJsonConfigFile.options,
  projectReferences: parsedJsonConfigFile.projectReferences,
});

const resolvedReferences = rootProgram.getResolvedProjectReferences();

for (const reference of resolvedReferences ?? []) {
  const { rootDir } = reference?.commandLine.options || {};
  if (!reference || !rootDir) continue;

  const program = ts.createProgram({
    options: {
      ...reference.commandLine.options,
      noEmit: true,
      emitDeclarationOnly: false,
    },
    rootNames: reference.commandLine.fileNames,
    projectReferences: reference.commandLine.projectReferences,
  });

  const typeChecker = program.getTypeChecker();
  const entryFile = path.join(rootDir, 'index.ts');

  const sourceFile = program.getSourceFile(entryFile);
  if (!sourceFile) continue;

  const sourceSymbol = typeChecker.getSymbolAtLocation(sourceFile);
  if (!sourceSymbol) continue;

  const exports = typeChecker.getExportsOfModule(sourceSymbol);

  console.log(
    sourceFile.fileName,
    exports.map((sym) => {
      const symType = typeChecker.getTypeOfSymbolAtLocation(sym, sourceFile);
      return [
        sym.escapedName,
        typeChecker.typeToString(
          symType,
          sourceFile,
          ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.NoTypeReduction
        ),
      ];
    })
  );
}
