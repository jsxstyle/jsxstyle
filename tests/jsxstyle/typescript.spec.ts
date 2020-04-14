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
  expect(report).toMatchInlineSnapshot(`
    "jsxstyle/typescript/demo.tsx(18,51): error TS2322: Type '{ value: string; typeError: boolean; }' is not assignable to type 'DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> | DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>'.
      Object literal may only specify known properties, and 'typeError' does not exist in type 'DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> | DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>'.
    jsxstyle/typescript/demo.tsx(23,21): error TS2322: Type '{ typeError: boolean; }' is not assignable to type 'DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>'.
      Object literal may only specify known properties, and 'typeError' does not exist in type 'DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>'.
    jsxstyle/typescript/demo.tsx(24,21): error TS2322: Type 'string' is not assignable to type 'number'.
    jsxstyle/typescript/demo.tsx(30,40): error TS2322: Type '{ typeError: boolean; }' is not assignable to type 'DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> | DemoProps'.
      Object literal may only specify known properties, and 'typeError' does not exist in type 'DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> | DemoProps'.
    jsxstyle/typescript/demo.tsx(33,40): error TS2322: Type 'string' is not assignable to type 'boolean'.
    jsxstyle/typescript/demo.tsx(38,50): error TS2322: Type '{ typeError: boolean; }' is not assignable to type 'DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> | DemoProps'.
      Object literal may only specify known properties, and 'typeError' does not exist in type 'DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> | DemoProps'.
    jsxstyle/typescript/demo.tsx(45,25): error TS2322: Type '{ opacity: number; paddingH: number; }' is not assignable to type 'Properties<string | number>'.
      Object literal may only specify known properties, but 'paddingH' does not exist in type 'Properties<string | number>'. Did you mean to write 'padding'?
    "
  `);
});
