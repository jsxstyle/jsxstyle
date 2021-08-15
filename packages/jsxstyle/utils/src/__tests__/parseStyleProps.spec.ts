import { parseStyleProps, ParsedStyleProp } from '../parseStyleProps';

const formatParsedStyleProps = (
  value: Record<string, ParsedStyleProp> | null | undefined
) =>
  Object.entries(value || {}).reduce<Record<string, any>>(
    (prev, [k, v]) => ((prev[k] = v.propValue), prev),
    {}
  );

describe('parseStyleProps', () => {
  it('returns empty values when given an empty props object', () => {
    const results = parseStyleProps({}, 'className');
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

    const { parsedStyleProps } = parseStyleProps(
      {
        prop1: 'string',
        prop2: 1234,
        prop3: 0,
        prop4: prototypeTest('wow'),
        prop5: null,
        prop6: undefined,
        prop7: false,
      },
      'className'
    );

    expect(formatParsedStyleProps(parsedStyleProps)).toMatchInlineSnapshot(`
      Object {
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
    const exampleProps = { banana: 'purple', className: 'purple' };

    const { parsedStyleProps: classNameParsedStyleProps } = parseStyleProps(
      exampleProps,
      'className'
    );
    const { parsedStyleProps: bananaParsedStyleProps } = parseStyleProps(
      exampleProps,
      'banana'
    );

    expect(Object.keys(classNameParsedStyleProps || {})).toEqual(['banana']);
    expect(Object.keys(bananaParsedStyleProps || {})).toEqual(['className']);
  });

  it('splits out pseudoelements and pseudoclasses', () => {
    const { parsedStyleProps } = parseStyleProps(
      {
        activeColor: 'purple',
        hoverColor: 'orange',
        placeholderColor: 'blue',
        selectionBackgroundColor: 'red',
      },
      'className'
    );

    expect(formatParsedStyleProps(parsedStyleProps)).toMatchInlineSnapshot(`
      Object {
        "backgroundColor::selection": "red",
        "color::placeholder": "blue",
        "color:active": "purple",
        "color:hover": "orange",
      }
    `);
  });

  it('splits out known component props', () => {
    const { componentProps, parsedStyleProps } = parseStyleProps(
      {
        name: 'name prop',
        id: 'id prop',
        href: 'https://jsx.style',
      },
      'className'
    );

    expect(componentProps).toMatchInlineSnapshot(`
      Object {
        "href": "https://jsx.style",
        "id": "id prop",
        "name": "name prop",
      }
    `);

    expect(parsedStyleProps).toEqual({});
  });

  it('splits out props starting with `on`', () => {
    const parsedProps = parseStyleProps(
      {
        // these props will be passed through as component props
        onBanana: 'purple',
        onClick: () => null,
        onNonExistentEventHandler: 123,

        // this should be considered a style
        ontological: 456,
      },
      'className'
    );

    expect(parsedProps).toMatchInlineSnapshot(`
      Object {
        "componentProps": Object {
          "onBanana": "purple",
          "onClick": [Function],
          "onNonExistentEventHandler": 123,
        },
        "parsedStyleProps": Object {
          "ontological": Object {
            "propName": "ontological",
            "propValue": 456,
            "pseudoclass": undefined,
            "pseudoelement": undefined,
            "specificity": 0,
          },
        },
      }
    `);
  });

  it('expands horizontal/vertical margin/padding shorthand props', () => {
    const { parsedStyleProps } = parseStyleProps(
      {
        aaa: 123,
        zzz: 123,
        margin: 1,
        marginH: 2,
        marginLeft: 3,
      },
      'className'
    );

    expect(formatParsedStyleProps(parsedStyleProps)).toMatchInlineSnapshot(`
      Object {
        "aaa": 123,
        "margin": 1,
        "marginLeft": 3,
        "marginRight": 2,
        "zzz": 123,
      }
    `);
  });

  it('supports pseudo-prefixed horizontal/vertical margin/padding shorthand props', () => {
    const { parsedStyleProps } = parseStyleProps(
      {
        margin: 1,
        marginH: 2,
        marginLeft: 3,
        hoverMarginLeft: 4,
        activeMarginV: 5,
        placeholderPaddingV: 6,
        placeholderPadding: 7,
        placeholderPaddingTop: 8,
      },
      'className'
    );

    expect(formatParsedStyleProps(parsedStyleProps)).toMatchInlineSnapshot(`
      Object {
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
    const { parsedStyleProps: parsedStyleProps1 } = parseStyleProps(
      {
        marginH: 1,
        marginLeft: 2,
      },
      'className'
    );

    const { parsedStyleProps: parsedStyleProps2 } = parseStyleProps(
      {
        marginLeft: 2,
        marginH: 1,
      },
      'className'
    );

    expect(formatParsedStyleProps(parsedStyleProps1)).toMatchInlineSnapshot(`
      Object {
        "marginLeft": 2,
        "marginRight": 1,
      }
    `);

    expect(formatParsedStyleProps(parsedStyleProps2)).toMatchInlineSnapshot(`
      Object {
        "marginLeft": 1,
        "marginRight": 1,
      }
    `);
  });
});
