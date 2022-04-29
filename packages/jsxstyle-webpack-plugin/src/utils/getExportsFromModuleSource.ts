import Module from 'module';
import path from 'path';
import vm from 'vm';

export const getExportsFromModuleSource = (
  modulePath: string,
  moduleContent: string
) => {
  if (!path.isAbsolute(modulePath)) {
    throw new Error(`Expected an absolute path, received ${modulePath}`);
  }
  const moduleObj: { exports: Record<string, unknown> } = { exports: {} };

  const requireFn = (importPath: any) => {
    throw new Error(`Unhandled module import: '${importPath}'`);
  };

  const wrappedModuleContent = Module.wrap(moduleContent);

  const moduleFunction = vm.runInThisContext(wrappedModuleContent);

  // `runInThisContext` returns a function (our string of JS wrapped with Module.wrap).
  // We call that function with our custom definitions for exports, require, module, __filename, and __dirname.
  moduleFunction(moduleObj.exports, requireFn, moduleObj, undefined, undefined);

  // `moduleObj` is mutated by the above function call. it contains anything exported by our string of JS.
  return moduleObj.exports;
};
