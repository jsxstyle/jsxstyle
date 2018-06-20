import {
  componentStyles,
  CSSProperties,
  Dict,
  getStyleCache,
} from 'jsxstyle-utils';
import * as React from 'react';

export { CSSProperties };

export const cache = getStyleCache();

export interface StylableComponentProps {
  className?: string;
  style?: React.CSSProperties;
}

export type AnyComponent<Props extends StylableComponentProps> =
  | keyof JSX.IntrinsicElements
  | React.ComponentType<Props>;

export type JsxstyleProps<ComponentProps> = {
  component?: AnyComponent<ComponentProps>;
  mediaQueries?: Dict<string>;
  props?: ComponentProps;
} & StylableComponentProps &
  CSSProperties;

function factory(displayName: string, defaultProps?: Dict<React.ReactText>) {
  const tagName = 'div';

  return class JsxstyleComponent<P> extends React.Component<JsxstyleProps<P>> {
    constructor(props: JsxstyleProps<P>) {
      super(props);
      this.component = props.component || tagName;
      this.className = cache.getClassName(props, props.className);
    }

    public static defaultProps = defaultProps;
    public static displayName = displayName;

    public className: string | null;
    public component: AnyComponent<JsxstyleProps<P>>;

    public componentWillReceiveProps(props: JsxstyleProps<P>) {
      this.component = props.component || tagName;
      this.className = cache.getClassName(props, props.className);
    }

    public render() {
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

function depFactory(displayName: string, defaultProps: {}) {
  let hasWarned = false;
  // tslint:disable-next-line max-classes-per-file
  return class DeprecatedJsxstyleComponent extends React.Component {
    public static displayName = displayName;
    public static defaultProps = defaultProps;

    public componentWillMount() {
      if (process.env.NODE_ENV !== 'production') {
        if (!hasWarned) {
          hasWarned = true;
          // tslint:disable-next-line no-console
          console.error(
            'jsxstyle\u2019s `%s` component is deprecated and will be removed in future versions of jsxstyle.',
            displayName
          );
        }
      }
    }

    public render() {
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
