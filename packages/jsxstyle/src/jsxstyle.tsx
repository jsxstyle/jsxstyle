import {
  componentStyles,
  CSSProperties,
  ExactCSSProperties,
  getStyleCache,
} from 'jsxstyle-utils';
import * as React from 'react';

type ComponentName = keyof typeof componentStyles;

export { CSSProperties, ExactCSSProperties };

export const cache = getStyleCache();

export interface StylableComponentProps {
  className?: string | null | false;
  style?: React.CSSProperties;
}

export type AnyComponent<Props extends StylableComponentProps> =
  | keyof JSX.IntrinsicElements
  | React.ComponentType<Props>;

export type JsxstyleProps<ComponentProps> = {
  component?: AnyComponent<ComponentProps>;
  mediaQueries?: Record<string, string>;
  props?: ComponentProps;
} & StylableComponentProps &
  CSSProperties;

function factory(displayName: ComponentName) {
  const tagName = 'div';
  const defaultProps = componentStyles[displayName] || undefined;

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
export const Block = factory('Block');
export const Inline = factory('Inline');
export const InlineBlock = factory('InlineBlock');

export const Row = factory('Row');
export const Col = factory('Col');
export const InlineRow = factory('InlineRow');
export const InlineCol = factory('InlineCol');

export const Grid = factory('Grid');

function depFactory(displayName: ComponentName) {
  const defaultProps = componentStyles[displayName];
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
export const Table = depFactory('Table');
export const TableRow = depFactory('TableRow');
export const TableCell = depFactory('TableCell');
// <Row display="inline-flex" />
export const Flex = depFactory('Flex');
export const InlineFlex = depFactory('InlineFlex');
