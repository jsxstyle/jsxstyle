import generate from '@babel/generator';
import * as t from '@babel/types';
import { getCustomPropsAstNode } from '../getCustomPropsAstNode';
import type { CustomPropsObject } from '@jsxstyle/core';

const getCustomPropsSnapshot = (obj: CustomPropsObject) =>
  generate(t.objectExpression(getCustomPropsAstNode(obj))).code;

describe('getCustomPropsAstNode', () => {
  it('works', () => {
    expect(getCustomPropsSnapshot({})).toMatchInlineSnapshot(`"{}"`);

    expect(
      getCustomPropsSnapshot({
        test: 'var(--abc)',
        nested: {
          test: 'var(--def)',
          nested: {
            test: 'var(--ghi)',
          },
        },
      })
    ).toMatchInlineSnapshot(`
      "{
        test: "var(--abc)",
        nested: {
          test: "var(--def)",
          nested: {
            test: "var(--ghi)"
          }
        }
      }"
    `);
  });
});
