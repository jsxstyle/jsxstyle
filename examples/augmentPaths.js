const Module = require('module');
const path = require('path');

const cwdWithNodeModules = path.join(process.cwd(), 'node_modules');

const oldNodeModulePaths = Module._nodeModulePaths;
Module._nodeModulePaths = function (from) {
  const paths = oldNodeModulePaths.call(this, from);
  return [cwdWithNodeModules, ...paths];
};
