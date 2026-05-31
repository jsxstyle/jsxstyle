import { transform } from '@jsxstyle/bundler-utils';
import { describe, expect, it } from 'vitest';

describe('turbopack-loader pipeline', () => {
  it('transforms jsxstyle source and produces CSS with expected class names', () => {
    const source = `
import { Block } from '@jsxstyle/react';
export const App = () => <Block color="red">Hi</Block>;
`;
    const result = transform(source, '/app/page.tsx', {
      classNameStrategy: 'hash',
      classNamePrefix: '_x',
    });

    expect(result.css.length).toBeGreaterThan(0);
    expect(result.css).toContain('color');
    // Class names should be plain (no :global wrapping needed for App Router)
    expect(result.css).toMatch(/\._x[a-z0-9]+/);
  });
});
