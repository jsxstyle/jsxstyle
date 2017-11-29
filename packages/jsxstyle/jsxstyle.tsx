import * as React from 'react';
import { Dict, componentStyles, getStyleCache } from 'jsxstyle-utils';

import CSSProperties from './CSSProperties';

export const cache = getStyleCache();

export interface StyleProps {
  className?: string;
  style?: React.CSSProperties;
}

export type AnyComponent<Props extends StyleProps> =
  | keyof JSX.IntrinsicElements
  | React.ComponentClass<Props>
  | React.SFC<Props>;

export type JsxstyleProps<ComponentProps> = {
  component?: AnyComponent<ComponentProps>;
  mediaQueries?: Dict<string>;
  props?: ComponentProps & {
    // className and style props cannot be set via the props prop
    className?: undefined;
    style?: undefined;
  };
} & StyleProps &
  CSSProperties;

function factory(displayName: string, defaultProps?: Dict<React.ReactText>) {
  const tagName = 'div';

  return class JsxstyleComponent<P> extends React.Component<JsxstyleProps<P>> {
    className: string | null;
    component: AnyComponent<JsxstyleProps<P>>;

    constructor(props: JsxstyleProps<P>) {
      super(props);
      this.component = props.component || tagName;
      this.className = cache.getClassName(props, props.className);
    }

    static defaultProps = defaultProps;
    static displayName = displayName;

    componentWillReceiveProps(props: JsxstyleProps<P>) {
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
