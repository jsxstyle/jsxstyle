import { transform } from '@jsxstyle/bundler-utils';
import * as esbuild from 'esbuild';

export const transpile = async (code: string) => {
  const errors: unknown[] = [];
  const warnings: unknown[] = [];

  // Step 1: Extract styles using SWC native transform
  const result = transform(code, '/example.tsx', {
    classNameStrategy: 'counter',
    classNamePrefix: '_x',
  });

  // Route diagnostics
  for (const w of result.warnings) warnings.push(w);
  for (const e of result.errors) errors.push(e);

  // Step 2: Convert JSX + ESM to browser-friendly CJS using esbuild
  const esbuildResult = await esbuild.transform(result.code, {
    loader: 'tsx',
    format: 'cjs',
    jsx: 'automatic',
    jsxImportSource: 'react',
  });

  return {
    css: result.css,
    cssFileName: result.cssFileName,
    js: result.code,
    browserFriendlyJs: esbuildResult.code,
    warnings,
    errors,
  };
};
