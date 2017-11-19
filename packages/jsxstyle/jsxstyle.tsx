import * as React from 'react';
import { componentStyles, getStyleCache } from 'jsxstyle-utils';
import { StyleCache } from 'jsxstyle-utils/src/getStyleCache';

import { CSSProperties } from './cssproperties';

export const cache: StyleCache = getStyleCache();

export interface ComponentPropProps {
  className?: any;
  style?: CSSProperties;
  [key: string]: any;
}

export type ComponentProp =
  | keyof JSX.IntrinsicElements
  | React.ComponentClass<ComponentPropProps>
  | React.SFC<ComponentPropProps>;

export interface JsxstyleProps extends CSSProperties {
  className?: string;
  component?: ComponentProp;
  mediaQueries?: { [key: string]: string };
  props?: { [key: string]: any };
  style?: CSSProperties;
}

function factory(
  displayName: string,
  defaultProps?: { [key: string]: React.ReactText } | null
) {
  const tagName = 'div';

  return class JsxstyleComponent extends React.Component<JsxstyleProps> {
    className: string;
    component: ComponentProp;

    constructor(props: JsxstyleProps) {
      super(props);
      this.component = props.component || tagName;
      this.className = cache.getClassName(props, props.className);
    }

    static defaultProps = defaultProps;
    static displayName = displayName;

    componentWillReceiveProps(props: JsxstyleProps) {
      this.component = props.component || tagName;
      this.className = cache.getClassName(props, props.className);
    }

    render() {
      const { props, style, children } = this.props;
      return (
        <this.component {...props} className={this.className} style={style}>
          {children}
        </this.component>
      );
    }
  };
}

export const Box = factory('Box');
export const Block = factory('Block', componentStyles.Block);
export const Inline = factory('Inline', componentStyles.Inline);
export const InlineBlock = factory('InlineBlock', componentStyles.InlineBlock);
export const Row = factory('Row', componentStyles.Row);
export const Col = factory('Col', componentStyles.Col);
export const Grid = factory('Grid', componentStyles.Grid);

export function install() {
  console.error(
    'jsxstyle\u2019s `install` method is no longer required and will be removed in jsxstyle 2.0.'
  );
}

function depFactory(displayName: string, defaultProps: {}) {
  let hasWarned = false;
  return class DeprecatedJsxstyleComponent extends React.Component {
    static displayName = displayName;
    static defaultProps = defaultProps;

    componentWillMount() {
      if (process.env.NODE_ENV !== 'production') {
        if (!hasWarned) {
          hasWarned = true;
          console.error(
            'jsxstyle\u2019s `%s` component is deprecated and will be removed in future versions of jsxstyle.',
            displayName
          );
        }
      }
    }

    render() {
      return <Box {...this.props} />;
    }
  };
}

// <Box component="table" />
export const Table = depFactory('Table', { display: 'table' });
export const TableRow = depFactory('TableRow', { display: 'table-row' });
export const TableCell = depFactory('TableCell', { display: 'table-cell' });
// <Row display="inline-flex" />
export const Flex = depFactory('Flex', { display: 'flex' });
export const InlineFlex = depFactory('InlineFlex', { display: 'inline-flex' });
