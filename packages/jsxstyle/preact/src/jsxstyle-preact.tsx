import {
  componentStyles,
  CSSProperties,
  Dict,
  getStyleCache,
} from 'jsxstyle-utils';
import * as preact from 'preact';

export const cache = getStyleCache();

export interface StyleProps {
  class?: string;
  style?: any;
}

export type AnyComponent<Props extends StyleProps> =
  | keyof JSX.IntrinsicElements
  | preact.ComponentConstructor<Props, any>
  // this isn't covered by preact.FunctionalComponent for some reason
  // see: https://github.com/developit/preact-router/blob/eb0206b/src/match.d.ts#L13
  | ((props?: Props, ...args: any[]) => preact.VNode | null);

export type JsxstyleProps<ComponentProps> = {
  children?: preact.VNode[];
  component?: AnyComponent<ComponentProps>;
  mediaQueries?: Dict<string>;
  props?: ComponentProps;
} & StyleProps &
  CSSProperties;

type JsxstyleComponent = preact.ComponentConstructor<
  JsxstyleProps<Dict<any>>,
  {}
>;

function factory(
  displayName: string,
  defaultProps?: Dict<string | number>
): JsxstyleComponent {
  const tagName = 'div';

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
export const Block = factory('Block', componentStyles.Block);
export const Inline = factory('Inline', componentStyles.Inline);
export const InlineBlock = factory('InlineBlock', componentStyles.InlineBlock);
export const Row = factory('Row', componentStyles.Row);
export const Col = factory('Col', componentStyles.Col);
export const Grid = factory('Grid', componentStyles.Grid);
