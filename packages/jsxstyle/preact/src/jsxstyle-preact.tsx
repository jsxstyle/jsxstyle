import {
  componentStyles,
  CSSProperties,
  ExactCSSProperties,
  getStyleCache,
} from 'jsxstyle-utils';
import * as preact from 'preact';

type ComponentName = keyof typeof componentStyles;

export { CSSProperties, ExactCSSProperties };

export const cache = getStyleCache();

export interface StylableComponentProps {
  class?: string | null | false;
  style?: any;
}

export type AnyComponent<Props extends StylableComponentProps> =
  | keyof JSX.IntrinsicElements
  | preact.ComponentConstructor<Props, any>
  // this isn't covered by preact.FunctionalComponent for some reason
  // see: https://github.com/developit/preact-router/blob/eb0206b/src/match.d.ts#L13
  | ((props?: Props, ...args: any[]) => preact.VNode | null);

export type JsxstyleProps<ComponentProps> = {
  children?: preact.ComponentChildren;
  component?: AnyComponent<ComponentProps>;
  mediaQueries?: Record<string, string>;
  props?: ComponentProps;
} & StylableComponentProps &
  CSSProperties;

type JsxstyleComponent = preact.ComponentConstructor<
  JsxstyleProps<Record<string, any>>,
  {}
>;

function factory(displayName: ComponentName): JsxstyleComponent {
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
    public component: AnyComponent<JsxstyleProps<P>>;

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
