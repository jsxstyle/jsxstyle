import React from 'react';
import { Row } from './index';

export function install() {
  console.error(
    'jsxstyle\u2019s `install` method is no longer required and will be removed in jsxstyle 2.0.'
  );
}

let hasWarnedAboutFlex = false;
export class Flex extends React.Component {
  componentWillMount() {
    if (process.env.NODE_ENV !== 'production') {
      if (!hasWarnedAboutFlex) {
        hasWarnedAboutFlex = true;
        console.error(
          'jsxstyle\u2019s `Flex` component is deprecated and will be removed in jsxstyle 2.0. Please use `Row` instead.'
        );
      }
    }
  }

  render() {
    return <Row {...this.props} />;
  }
}
