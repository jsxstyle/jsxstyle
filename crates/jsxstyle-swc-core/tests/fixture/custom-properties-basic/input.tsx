import { makeCustomProperties } from '@jsxstyle/react';
const props = makeCustomProperties({
  prop1: 'prop1 value',
  prop2: 123,
})
  .addVariant(
    'banana',
    {
      prop1: 'banana prop1 value',
    },
    {
      mediaQuery: 'mq',
    }
  )
  .build();
