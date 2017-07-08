'use strict';

const getStyleKeysForProps = require('../src/getStyleKeysForProps');

describe('getStyleKeysForProps', () => {
  it('returns null when given an empty style object', () => {
    const markup = getStyleKeysForProps({});
    expect(markup).toBeNull();
  });

  it('converts a style object to a style string that only contains valid styles', () => {
    function Useless(stuff) {
      this.stuff = stuff;
    }

    Object.assign(Useless.prototype, {
      toString() {
        return this.stuff;
      },
    });

    function prototypeTest(stuff) {
      return new Useless(stuff);
    }

    const markup = getStyleKeysForProps({
      validProp1: 'string',
      validProp2: 1234,
      validProp3: 0,
      validProp4: prototypeTest('wow'),
      invalidProp1: null,
      invalidProp2: undefined,
      invalidProp3: false, // hmmmmmmmmmmmmm
    });

    expect(markup).toEqual({
      normal: {
        css: `
  valid-prop1:string;
  valid-prop2:1234px;
  valid-prop3:0;
  valid-prop4:wow;
`,
      },
    });
  });
});
