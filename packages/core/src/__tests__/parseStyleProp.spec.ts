import { parseStyleProp } from '../parseStyleProp';

describe('parseStyleProp', () => {
  it('handles style props', () => {
    const result = parseStyleProp('display', 'none');
    expect(result).toMatchInlineSnapshot(`
      {
        "parsedStyleProps": {
          "display": {
            "key": "display",
            "propName": "display",
            "propValue": "none",
            "specificity": 0,
          },
        },
        "type": "styleProp",
      }
    `);
  });

  it('handles component props', () => {
    expect(parseStyleProp('onExampleProp', 'banana')).toMatchInlineSnapshot(`
      {
        "key": "onExampleProp",
        "type": "componentProp",
        "value": "banana",
      }
    `);

    expect(parseStyleProp('class', 'one two three')).toMatchInlineSnapshot(`
      {
        "key": "class",
        "type": "componentProp",
        "value": "one two three",
      }
    `);
  });

  it('handles media queries', () => {
    expect(
      parseStyleProp('@media wow', {
        display: 'none',
        color: 'red',
      })
    ).toMatchInlineSnapshot(`
      {
        "parsedStyleProps": {
          "color@media wow": {
            "key": "color@media wow",
            "propName": "color",
            "propValue": "red",
            "queryString": "@media wow",
            "specificity": 0,
          },
          "display@media wow": {
            "key": "display@media wow",
            "propName": "display",
            "propValue": "none",
            "queryString": "@media wow",
            "specificity": 0,
          },
        },
        "type": "styleProp",
      }
    `);

    expect(parseStyleProp('@media wow', {})).toMatchInlineSnapshot(`
      {
        "parsedStyleProps": {},
        "type": "styleProp",
      }
    `);

    expect(parseStyleProp('@media wow', 'invalid value')).toBeNull();
  });
});
