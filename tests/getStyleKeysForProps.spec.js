'use strict';

const getStyleKeysForProps = require('../lib/getStyleKeysForProps');

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

    const markup = getStyleKeysForProps(
      {
        prop1: 'string',
        prop2: 1234,
        prop3: 0,
        prop4: prototypeTest('wow'),
        prop5: null,
        prop6: undefined,
        prop7: false,
      },
      true
    );

    expect(markup).toEqual({
      '.': {
        styles: `
  prop1: string;
  prop2: 1234px;
  prop3: 0;
  prop4: wow;
`,
      },
      classNameKey: 'prop1:string;prop2:1234px;prop3:0;prop4:wow;',
    });
  });
});
