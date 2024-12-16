import { generate } from '../babelUtils';
import { primitiveValueToNode } from '../primitiveValueToNode';

const doTheThing = (value: unknown) => {
  return generate(primitiveValueToNode(value)).code;
};

describe('primitiveValueToNode', () => {
  it('works', () => {
    expect(doTheThing(null)).toMatchInlineSnapshot(`"null"`);
    expect(doTheThing(123)).toMatchInlineSnapshot(`"123"`);
    expect(doTheThing('hello')).toMatchInlineSnapshot(`""hello""`);
    expect(doTheThing(undefined)).toMatchInlineSnapshot(`"undefined"`);

    expect(() =>
      doTheThing(Symbol.for('banana'))
    ).toThrowErrorMatchingInlineSnapshot(`[Error: Unhandled value type: symbol]`);

    expect(
      doTheThing({
        stringProp: 'hello',
        nestedObject: {
          nestedObject: {
            nestedObject: {},
          },
          test: 123,
          thing: null,
          thing2: undefined,
          _test: 123,
          'computed value': 123,
        },
      })
    ).toMatchInlineSnapshot(`
      "{
        stringProp: "hello",
        nestedObject: {
          nestedObject: {
            nestedObject: {}
          },
          test: 123,
          thing: null,
          thing2: undefined,
          _test: 123,
          "computed value": 123
        }
      }"
    `);
  });
});
