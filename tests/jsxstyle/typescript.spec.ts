import path = require('path');
import * as ts from 'typescript';

// tslint:disable-next-line no-var-requires
const tsConfig = require('jsxstyle/src/tsconfig.json');

const demoFile = path.resolve(__dirname, './typescript/demo.tsx');

it('compiles', () => {
  // TODO: why doesn't TS find `jsx` in compilerOptions?
  const options = { ...tsConfig, jsx: 'react' };
  const host = ts.createCompilerHost(options);
  const program = ts.createProgram([demoFile], options, host);
  const diagnostics = ts.getPreEmitDiagnostics(program);
  let report = '';
  if (diagnostics.length > 0) {
    report = ts.formatDiagnostics(diagnostics, host);
  }
  expect(report).toEqual('');
});
