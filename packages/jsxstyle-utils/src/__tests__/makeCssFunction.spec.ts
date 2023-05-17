import { makeCssFunction } from '../makeCssFunction';
import { getStyleCache } from '../getStyleCache';

const makeThing = () => {
  const insertedCss: string[] = [];
  const styleCache = getStyleCache();
  styleCache.injectOptions({
    onInsertRule(rule) {
      insertedCss.push(rule);
    },
  });
  const css = makeCssFunction('className', styleCache.getComponentProps);
  return (...params: Parameters<typeof css>) => {
    const result = css(...params);
    return {
      classNames: result,
      insertedCss,
    };
  };
};

describe('makeCssFunction', () => {
  it('returns empty values when given an empty props object', () => {
    const css = makeThing();
    const results = css({
      color: 'red',
      '&': {
        color: 'red',
      },
    });
    expect(results).toMatchInlineSnapshot(`
      {
        "classNames": "_1jvcvsh _vx2q8h",
        "insertedCss": [
          "._1jvcvsh { color:red }",
          "._vx2q8h { color:red }",
        ],
      }
    `);
  });
});
