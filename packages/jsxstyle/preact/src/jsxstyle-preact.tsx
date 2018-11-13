import {
  CSSProperties,
  ExactCSSProperties,
  componentStyles,
  getStyleCache,
} from 'jsxstyle-utils';
import * as preact from 'preact';

type JsxstyleComponentName = keyof typeof componentStyles;

export { CSSProperties, ExactCSSProperties };

export const cache = getStyleCache();

/** Props that will be passed through to whatever component is specified */
export interface StylableComponentProps {
  /** passed as-is through to the underlying component */
  class?: string | null | false;
  /** passed as-is through to the underlying component */
  style?: any;
}

export type AnyComponent<Props extends StylableComponentProps> =
  | keyof JSX.IntrinsicElements
  | preact.ComponentConstructor<Props, any>
  // this isn't covered by preact.FunctionalComponent for some reason
  // see: https://github.com/developit/preact-router/blob/eb0206b/src/match.d.ts#L13
  | ((props?: Props, ...args: any[]) => preact.VNode | null);

export interface JsxstyleProps<ComponentProps>
  extends StylableComponentProps,
    CSSProperties {
  children?: preact.ComponentChildren;
  /** Component value can be either a Preact component or a tag name string. Defaults to "div". */
  component?: AnyComponent<ComponentProps>;
  /** An object of media query values keyed by the desired style prop prefix */
  mediaQueries?: Record<string, string>;
  /** Object of props that will be passed down to the component specified in the `component` prop */
  props?: ComponentProps;
}

type JsxstyleComponent = preact.ComponentConstructor<
  JsxstyleProps<Record<string, any>>,
  {}
>;

function factory(displayName: JsxstyleComponentName): JsxstyleComponent {
  const tagName = 'div';
  const defaultProps = componentStyles[displayName] || undefined;

  return class<P> extends preact.Component<JsxstyleProps<P>, {}> {
    constructor(props: JsxstyleProps<P>) {
      super(props);
      this.component = props.component || tagName;
      this.className = cache.getClassName(props, props.class);
    }

    public static defaultProps = defaultProps;
    public static displayName = displayName;

    public className: string | null;
    public component: AnyComponent<P>;

    public componentWillReceiveProps(props: JsxstyleProps<P>) {
      this.component = props.component || tagName;
      this.className = cache.getClassName(props, props.class);
    }

    public render({ props, style, children }: JsxstyleProps<P>) {
      return (
        <this.component {...props} class={this.className} style={style}>
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
