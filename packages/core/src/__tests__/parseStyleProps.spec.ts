import { type ParsedStyleProp, parseStyleProps } from '../parseStyleProps';
import type { JsxstyleComponentStyleProps } from '../types';

const formatParsedStyleProps = (
  value: Record<string, ParsedStyleProp> | null | undefined
) =>
  Object.entries(value || {}).reduce<Record<string, unknown>>(
    (prev, [k, v]) => {
      prev[k] = v.propValue;
      return prev;
    },
    {}
  );

describe('parseStyleProps', () => {
  it('returns empty values when given an empty props object', () => {
    const results = parseStyleProps({});
    expect(results).toEqual({
      componentProps: {},
      parsedStyleProps: {},
    });
  });

  it('converts a style object to a style string that only contains valid styles', () => {
    class Useless {
      constructor(public stuff: string) {}
      toString(): string {
        return this.stuff;
      }
    }

    function prototypeTest(stuff: string) {
      return new Useless(stuff);
    }

    const { parsedStyleProps } = parseStyleProps({
      prop1: 'string',
      prop2: 1234,
      prop3: 0,
      prop4: prototypeTest('wow'),
      prop5: null,
      prop6: undefined,
      prop7: false,
    });

    expect(formatParsedStyleProps(parsedStyleProps)).toMatchInlineSnapshot(`
      {
        "prop1": "string",
        "prop2": 1234,
        "prop3": 0,
        "prop4": Useless {
          "stuff": "wow",
        },
      }
    `);
  });

  it('uses classNamePropKey to filter out className prop', () => {
    const exampleProps = {
      banana: 'purple',
      class: 'blue',
      className: 'purple',
    };

    const result = parseStyleProps(exampleProps);

    expect(result).toMatchInlineSnapshot(`
      {
        "componentProps": {
          "class": "blue",
          "className": "purple",
        },
        "parsedStyleProps": {
          "banana": {
            "propName": "banana",
            "propValue": "purple",
            "specificity": 0,
          },
        },
      }
    `);
  });

  it('splits out pseudoelements and pseudoclasses', () => {
    const { parsedStyleProps } = parseStyleProps({
      activeColor: 'purple',
      hoverColor: 'orange',
      placeholderColor: 'blue',
      selectionBackgroundColor: 'red',
    });

    expect(formatParsedStyleProps(parsedStyleProps)).toMatchInlineSnapshot(`
      {
        "backgroundColor::selection": "red",
        "color::placeholder": "blue",
        "color:active": "purple",
        "color:hover": "orange",
      }
    `);
  });

  it('splits out known component props', () => {
    const { componentProps, parsedStyleProps } = parseStyleProps({
      name: 'name prop',
      id: 'id prop',
      href: 'https://jsx.style',
      class: 'wow ok',
      className: 'wow1 ok1',
    });

    expect(componentProps).toMatchInlineSnapshot(`
      {
        "class": "wow ok",
        "className": "wow1 ok1",
        "href": "https://jsx.style",
        "id": "id prop",
        "name": "name prop",
      }
    `);

    expect(parsedStyleProps).toEqual({});
  });

  it('splits out props starting with `on`', () => {
    const parsedProps = parseStyleProps({
      // these props will be passed through as component props
      onBanana: 'purple',
      onClick: () => null,
      onNonExistentEventHandler: 123,

      // this should be considered a style
      ontological: 456,
    });

    expect(parsedProps).toMatchInlineSnapshot(`
      {
        "componentProps": {
          "onBanana": "purple",
          "onClick": [Function],
          "onNonExistentEventHandler": 123,
        },
        "parsedStyleProps": {
          "ontological": {
            "propName": "ontological",
            "propValue": 456,
            "specificity": 0,
          },
        },
      }
    `);
  });

  it('expands horizontal/vertical margin/padding shorthand props', () => {
    const { parsedStyleProps } = parseStyleProps({
      aaa: 123,
      zzz: 123,
      margin: 1,
      marginH: 2,
      marginLeft: 3,
    });

    expect(formatParsedStyleProps(parsedStyleProps)).toMatchInlineSnapshot(`
      {
        "aaa": 123,
        "margin": 1,
        "marginLeft": 3,
        "marginRight": 2,
        "zzz": 123,
      }
    `);
  });

  it('supports pseudo-prefixed horizontal/vertical margin/padding shorthand props', () => {
    const { parsedStyleProps } = parseStyleProps({
      margin: 1,
      marginH: 2,
      marginLeft: 3,
      hoverMarginLeft: 4,
      activeMarginV: 5,
      placeholderPaddingV: 6,
      placeholderPadding: 7,
      placeholderPaddingTop: 8,
    });

    expect(formatParsedStyleProps(parsedStyleProps)).toMatchInlineSnapshot(`
      {
        "margin": 1,
        "marginBottom:active": 5,
        "marginLeft": 3,
        "marginLeft:hover": 4,
        "marginRight": 2,
        "marginTop:active": 5,
        "padding::placeholder": 7,
        "paddingBottom::placeholder": 6,
        "paddingTop::placeholder": 8,
      }
    `);
  });

  it('creates different sets of styles for differently ordered props', () => {
    const { parsedStyleProps: parsedStyleProps1 } = parseStyleProps({
      marginH: 1,
      marginLeft: 2,
    });

    const { parsedStyleProps: parsedStyleProps2 } = parseStyleProps({
      marginLeft: 2,
      marginH: 1,
    });

    expect(formatParsedStyleProps(parsedStyleProps1)).toMatchInlineSnapshot(`
      {
        "marginLeft": 2,
        "marginRight": 1,
      }
    `);

    expect(formatParsedStyleProps(parsedStyleProps2)).toMatchInlineSnapshot(`
      {
        "marginLeft": 1,
        "marginRight": 1,
      }
    `);
  });

  it('handles media queries correctly', () => {
    const props: JsxstyleComponentStyleProps = {
      padding: 123,
      '@media 345': {
        padding: 345,
        // @ts-expect-error nested media queries aren't supported by typing and should be removed
        '@media 567': {
          padding: 567,
          '@media 789': {
            padding: 789,
          },
        },
      },
    };

    const parsed = parseStyleProps(props);

    expect(parsed).toMatchInlineSnapshot(
      `
      {
        "componentProps": {},
        "parsedStyleProps": {
          "padding": {
            "propName": "padding",
            "propValue": 123,
            "specificity": 0,
          },
          "padding@media 345": {
            "propName": "padding",
            "propValue": 345,
            "queryString": "@media 345",
            "specificity": 0,
          },
        },
      }
    `
    );
  });
});
