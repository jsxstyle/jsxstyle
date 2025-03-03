import { processMakeComponentStyleProps } from '../processMakeComponentStyleProp';

describe('processMakeComponentStyleProps', () => {
  it('works', () => {
    const rules: string[] = [];
    const result = processMakeComponentStyleProps(
      {
        display: 'block',
        paddingH: 69,
        paddingV: 42,
      },
      (key) => `_${key.replace(/\W/gi, '_')}`,
      (rule) => void rules.push(rule)
    );

    expect(result).toMatchInlineSnapshot(`
      {
        "display": "_display_block",
        "paddingBottom": "_paddingBottom_42px",
        "paddingLeft": "_paddingLeft_69px",
        "paddingRight": "_paddingRight_69px",
        "paddingTop": "_paddingTop_42px",
      }
    `);

    expect(rules).toMatchInlineSnapshot(`
      [
        "._display_block{display:block}",
        "._paddingLeft_69px._paddingLeft_69px{padding-left:69px}",
        "._paddingRight_69px._paddingRight_69px{padding-right:69px}",
        "._paddingTop_42px._paddingTop_42px{padding-top:42px}",
        "._paddingBottom_42px._paddingBottom_42px{padding-bottom:42px}",
      ]
    `);
  });
});
