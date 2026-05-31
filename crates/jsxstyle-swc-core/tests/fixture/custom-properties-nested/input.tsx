import { makeCustomProperties } from '@jsxstyle/react';
const props = makeCustomProperties({
  prop1: 'prop1 value',
  prop2: 123,
  nested: {
    prop3: 'nested prop3 value',
    nested2: {
      prop4: 'nested2 prop4 value',
    },
  },
})
  .addVariant(
    'banana',
    {
      prop1: 'banana prop1 value',
      nested: {
        nested2: {
          prop4: 'banana nested2 prop4 value',
        },
      },
    },
    {
      mediaQuery: 'mq',
    }
  )
  .build({
    namespace: 'test',
    mangle: true,
  });
