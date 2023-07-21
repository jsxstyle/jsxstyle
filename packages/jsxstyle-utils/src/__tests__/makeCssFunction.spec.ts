import { makeCssFunction } from '../makeCssFunction';
import { getStyleCache } from '../getStyleCache';

const getCssFunction = () => {
  const insertedCss: string[] = [];
  const styleCache = getStyleCache();
  styleCache.injectOptions({
    onInsertRule(rule) {
      insertedCss.push(rule);
    },
  });
  const css = makeCssFunction('className', styleCache);
  return (...params: Parameters<typeof css>) => {
    const result = css(...params);
    return {
      classNames: result,
      insertedCss,
    };
  };
};

describe('makeCssFunction', () => {
  it('works', () => {
    const css = getCssFunction();
    const results = css({
      color: 'red',
      '@media screen': {
        color: 'red',
        '&:ok': {
          color: 'red',
        },
      },
      '&.card h2': {
        fontSize: '1em',
      },
      '@container (max-width: 30em)': {
        '&.card h2': {
          fontSize: '2em',
        },
      },
    });
    expect(results).toMatchInlineSnapshot(`
      {
        "classNames": "_1jvcvsh _173elxt _o8m89d _be7p3k _ivsi2b",
        "insertedCss": [
          "._1jvcvsh { color:red }",
          "@media screen { ._173elxt._173elxt._173elxt { color:red } }",
          "@media screen { ._o8m89d._o8m89d._o8m89d:ok { color:red } }",
          "._be7p3k._be7p3k.card h2 { font-size:1em }",
          "@container (max-width: 30em) { ._ivsi2b._ivsi2b._ivsi2b._ivsi2b.card h2 { font-size:2em } }",
        ],
      }
    `);
  });
});
