import babylon = require('babylon');
import { BabylonPlugin } from '../../types';

export default function parse(
  code: string | Buffer,
  plugins: BabylonPlugin[] = []
): any {
  return babylon.parse(code.toString(), {
    sourceType: 'module',
    plugins: Array.from(
      new Set<BabylonPlugin>([
        'asyncGenerators',
        'classProperties',
        'dynamicImport',
        'functionBind',
        'jsx',
        'objectRestSpread',
        ...plugins,
      ])
    ),
  });
}
