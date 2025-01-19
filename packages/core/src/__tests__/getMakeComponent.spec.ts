import { makeGetPropsFunction, makeVariant } from '../getMakeComponent';
import { getStyleCache } from '../getStyleCache';

describe('getMakeComponent', () => {
  it('works', () => {
    let index = 0;
    const insertedRules: string[] = [];
    const cache = getStyleCache({
      getClassName: () => '_' + (index++).toString(36),
      onInsertRule: (rule) => void insertedRules.push(rule),
    });

    const getProps = makeGetPropsFunction(
      cache,
      {
        display: 'flex',
        marginLeft: 20,
        margin: 20,
        paddingH: 69,
      },
      {
        size: makeVariant([1, 2, 3], (variant) => ({
          width: variant * 111,
          display: 'block',
        })),
        thing: {
          display: 'block',
          paddingH: 42,
        },
      }
    );

    expect(
      getProps({
        id: 'banana',
        className: 'banana',
        size: 3,
        thing: true,
      })
    ).toMatchInlineSnapshot(`
      {
        "className": "banana _6 _1 _2 _9 _a _8",
        "id": "banana",
      }
    `);

    expect(insertedRules).toMatchInlineSnapshot(`
      [
        "._0{display:flex}",
        "._1._1{margin-left:20px}",
        "._2{margin:20px}",
        "._3._3{padding-left:69px}",
        "._4._4{padding-right:69px}",
        "._5{width:111px}",
        "._6{display:block}",
        "._7{width:222px}",
        "._8{width:333px}",
        "._9._9{padding-left:42px}",
        "._a._a{padding-right:42px}",
      ]
    `);
  });
});
