import 'monaco-editor/esm/vs/basic-languages/typescript/typescript.contribution';
import 'monaco-editor/esm/vs/language/typescript/tsMode';
import 'monaco-editor/esm/vs/editor/editor.all';

import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import reactDts from '../../../node_modules/@types/react/index.d.ts?raw';
import reactRuntimeDts from '../../../node_modules/@types/react/jsx-runtime.d.ts?raw';
import csstypeDts from '../../../node_modules/csstype/index.d.ts?raw';

const jsxstyleTypes = import.meta.glob(
  '../../../packages/jsxstyle/lib/**/*.d.ts',
  { query: '?raw', import: 'default', eager: true }
);

monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true);

monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
  target: monaco.languages.typescript.ScriptTarget.ES2015,
  esModuleInterop: true,
  jsx: monaco.languages.typescript.JsxEmit.ReactJSX,
  moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
  module: monaco.languages.typescript.ModuleKind.CommonJS,
  noEmit: false,
  strict: true,
  lib: ['lib.esnext.d.ts', 'lib.dom.d.ts'],
});

for (const [fileName, fileContent] of Object.entries(jsxstyleTypes)) {
  if (typeof fileContent !== 'string') {
    console.error('Module content for file `%s` is not a string', fileName);
    continue;
  }
  const trimmedFileName = fileName.replace('../../../packages/', '');
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    fileContent,
    `file:///node_modules/${trimmedFileName}`
  );
}

monaco.languages.typescript.typescriptDefaults.addExtraLib(
  `export * from './lib/jsxstyle-react/src/index';`,
  'file:///node_modules/jsxstyle/index.d.ts'
);

monaco.languages.typescript.typescriptDefaults.addExtraLib(
  reactDts,
  'file:///node_modules/react/index.d.ts'
);

monaco.languages.typescript.typescriptDefaults.addExtraLib(
  reactRuntimeDts,
  'file:///node_modules/react/jsx-runtime.d.ts'
);

monaco.languages.typescript.typescriptDefaults.addExtraLib(
  csstypeDts,
  'file:///node_modules/csstype/index.d.ts'
);

monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
  noSemanticValidation: false,
  noSyntaxValidation: false,
});

export { monaco };
