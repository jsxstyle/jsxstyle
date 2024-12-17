export const wrap = (value: string) =>
  `(function (exports, require, module, __filename, __dirname) { ${value}\n});`;
