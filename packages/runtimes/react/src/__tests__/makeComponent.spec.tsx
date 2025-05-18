// @vitest-environment jsdom

import { makeVariant } from '@jsxstyle/core';
import { render, screen } from '@testing-library/react';
import { cleanup } from '@testing-library/react';
// biome-ignore lint/style/useImportType: no
import * as React from 'react';
import { afterEach } from 'vitest';
import { makeComponent, styled } from '../makeComponent.js';

const getStylesByClassName = (rules: CSSRuleList): Record<string, string> => {
  const ret: Record<string, string> = {};
  for (const cssRule of Array.from(rules)) {
    const rule = cssRule as CSSStyleRule;
    const selector = rule.selectorText;
    const key = selector.slice(1);
    let css = '';
    for (const styleKey of Array.from(rule.style)) {
      css += `${styleKey}:${rule.style.getPropertyValue(styleKey)};`;
    }
    ret[key] = css;
  }
  return ret;
};

afterEach(() => {
  cleanup();
});

describe('makeComponent', () => {
  it('applies default styles', async () => {
    const Box = makeComponent(
      'div',
      {
        display: 'block',
      },
      {
        isWhite: { color: 'white' },
        isBlack: { color: 'black' },
        fruit: makeVariant(['apple', 'banana', 'orange'], (fruit) => ({
          display: fruit,
        })),
      }
    );

    render(<Box data-testid="box" />);

    const box = await screen.findByTestId('box');
    const classes = Array.from(box.classList);
    const stylesByClassName = getStylesByClassName(
      document.querySelector('style')?.sheet?.cssRules!
    );

    expect(classes.join(' ')).toMatchInlineSnapshot(`"_cmecz0"`);

    expect(
      classes.map((className) => stylesByClassName[className]).join('')
    ).toMatchInlineSnapshot(`"display:block;"`);
  });

  it('overrides duplicate style props', async () => {
    const Box = makeComponent(
      'div',
      {
        display: 'block',
      },
      {
        isWhite: { color: 'white' },
        isBlack: { color: 'black' },
        color: makeVariant(['apple', 'banana', 'orange'], (fruit) => ({
          color: fruit,
        })),
      }
    );

    render(<Box data-testid="box" isWhite isBlack />);

    const box = await screen.findByTestId('box');
    const classes = Array.from(box.classList);
    const stylesByClassName = getStylesByClassName(
      document.querySelector('style')?.sheet?.cssRules!
    );

    expect(classes.join(' ')).toMatchInlineSnapshot(`"_cmecz0 _1g4xecl"`);

    expect(
      classes.map((className) => stylesByClassName[className]).join('')
    ).toMatchInlineSnapshot(`"display:block;color:black;"`);
  });

  it('supports styled components-type usage', async () => {
    const Box = styled.div(null, {
      color: makeVariant(['red', 'green', 'blue'], (color) => ({ color })),
    });

    render(
      <Box
        data-testid="box"
        color="red"
        aria-label="box"
        className="example-classname"
      />
    );

    const box = await screen.findByTestId('box');
    const classes = Array.from(box.classList);
    const stylesByClassName = getStylesByClassName(
      document.querySelector('style')?.sheet?.cssRules!
    );

    expect(classes.join(' ')).toMatchInlineSnapshot(
      `"example-classname _1jvcvsh"`
    );

    expect(
      classes.map((className) => stylesByClassName[className]).join('')
    ).toMatchInlineSnapshot(`"color:red;"`);
  });

  it('works with custom components', async () => {
    const ExampleComponent: React.FC<{ color: 'purple' }> = (props) => (
      <b {...props} />
    );

    const BananaBox = styled(ExampleComponent, null, {
      color: makeVariant(['red', 'green', 'blue'], (color) => ({ color })),
    });

    render(<BananaBox data-testid="banana-box" color="green" />);

    const bananaBox = await screen.findByTestId('banana-box');
    const classes = Array.from(bananaBox.classList);
    const stylesByClassName = getStylesByClassName(
      document.querySelector('style')?.sheet?.cssRules!
    );

    expect(classes.join(' ')).toMatchInlineSnapshot(`"_mubem1"`);

    expect(
      classes.map((className) => stylesByClassName[className]).join('')
    ).toMatchInlineSnapshot(`"color:green;"`);
  });

  it('adds all styles to the document', async () => {
    styled.div(null, {
      color: makeVariant(['red', 'green', 'blue'], (color) => ({ color })),
    });

    const stylesByClassName = getStylesByClassName(
      document.querySelector('style')?.sheet?.cssRules!
    );

    // hmmm, looks like the DOM isn't getting reset between tests
    expect(stylesByClassName).toMatchInlineSnapshot(`
      {
        "_19juzxi": "display:banana;",
        "_1f8gb65": "display:apple;",
        "_1g4xecl": "color:black;",
        "_1jvcvsh": "color:red;",
        "_1mb383g": "color:blue;",
        "_1qfq1tx": "color:white;",
        "_1um5eq2": "color:apple;",
        "_cmecz0": "display:block;",
        "_kuntkl": "display:orange;",
        "_lddo2p": "color:banana;",
        "_mubem1": "color:green;",
        "_r26hf6": "color:orange;",
      }
    `);
  });
});
