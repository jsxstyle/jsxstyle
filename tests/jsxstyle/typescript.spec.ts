import path = require('path');
import * as ts from 'typescript';

const typecheckFiles = (filenames: string[]): string => {
  const options: ts.CompilerOptions = {
    jsx: ts.JsxEmit.React,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.NodeJs,
    target: ts.ScriptTarget.ES5,
  };
  const host = ts.createCompilerHost(options);
  const program = ts.createProgram(filenames, options, host);
  const diagnostics = ts.getPreEmitDiagnostics(program);
  let report = '';
  if (diagnostics.length > 0) {
    report = ts.formatDiagnostics(diagnostics, host);
  }
  return report;
};

it('throws type errors for invalid component/prop types', () => {
  const demoFile = path.resolve(__dirname, './typescript/demo.tsx');
  const report = typecheckFiles([demoFile]);
  expect(report).toMatchInlineSnapshot(`""`);
});
