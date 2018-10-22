import {
  componentStyles,
  CSSProperties,
  ExactCSSProperties,
  getStyleCache,
} from 'jsxstyle-utils';
import * as React from 'react';

type JsxstyleComponentName = keyof typeof componentStyles;

export { CSSProperties, ExactCSSProperties };

export const cache = getStyleCache();

/** Props that will be passed through to whatever component is specified */
export interface StylableComponentProps {
  /** passed as-is through to the underlying component */
  className?: string | null | false;
  /** passed as-is through to the underlying component */
  style?: React.CSSProperties | null | false;
}

export type AnyComponent<Props extends StylableComponentProps> =
  | keyof JSX.IntrinsicElements
  | React.ComponentType<Props>;

export type JsxstyleProps<ComponentProps> = {
  /** Component value can be either a React component or a tag name string. Defaults to "div". */
  component?: AnyComponent<ComponentProps>;
  /** An object of media query values keyed by the desired style prop prefix */
  mediaQueries?: Record<string, string>;
  /** Object of props that will be passed down to the component specified in the `component` prop */
  props?: ComponentProps;
} & StylableComponentProps &
  CSSProperties;

const getDerivedStateFromProps = (
  props: JsxstyleProps<any>
): { className: string | null } => ({
  className: cache.getClassName(props, props.className),
});

function factory(displayName: JsxstyleComponentName) {
  const tagName = 'div';
  const defaultProps = componentStyles[displayName];

  return class JsxstyleComponent<
    P extends StylableComponentProps
  > extends React.Component<JsxstyleProps<P>, { className: string | null }> {
    constructor(props: JsxstyleProps<P>) {
      super(props);
      // className will be set before initial render with either getDerivedStateFromProps or componentWillMount
      this.state = { className: null };

      const componentWillMount: any = () => {
        this.setState(getDerivedStateFromProps(this.props));
      };

      const componentWillReceiveProps: any = (nextProps: JsxstyleProps<P>) => {
        this.setState(getDerivedStateFromProps(nextProps));
      };

      // In React 16.3+, deprecated lifecycles will not be called if getDerivedStateFromProps is defined.
      // This boolean prevents React from logging the presence of these functions as an error in strict mode.
      // See https://github.com/reactjs/react-lifecycles-compat/blob/0a02b80/index.js#L47
      componentWillReceiveProps.__suppressDeprecationWarning = true;
      componentWillMount.__suppressDeprecationWarning = true;

      this.componentDidMount = componentWillMount;
      this.componentWillReceiveProps = componentWillReceiveProps;
    }

    public static defaultProps = defaultProps;
    public static displayName = displayName;
    public static getDerivedStateFromProps = getDerivedStateFromProps;

    public render() {
      const { props, style, children } = this.props;
      const Component = this.props.component || tagName;

      return (
        <Component
          {...props}
          className={this.state.className || undefined}
          style={style}
        >
          {children}
        </Component>
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

function depFactory(displayName: JsxstyleComponentName) {
  const defaultProps = componentStyles[displayName];
  let hasWarned = false;
  // tslint:disable-next-line max-classes-per-file
  return class DeprecatedJsxstyleComponent<
    P extends StylableComponentProps
  > extends React.Component<JsxstyleProps<P>> {
    constructor(props: JsxstyleProps<P>) {
      super(props);
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

    public static displayName = displayName;
    public static defaultProps = defaultProps;

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
