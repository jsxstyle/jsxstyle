import * as preact from 'preact';
import {
  componentStyles,
  CSSProperties,
  Dict,
  getStyleCache,
} from 'jsxstyle-utils';

export const cache = getStyleCache();

export interface StyleProps {
  class?: string;
  style?: any;
}

export type AnyComponent<Props extends StyleProps> =
  | keyof JSX.IntrinsicElements
  | preact.AnyComponent<Props, any>
  // this isn't covered by preact.FunctionalComponent for some reason
  | ((props?: Props) => preact.VNode);

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

  return class JsxstyleComponent<P> extends preact.Component<
    JsxstyleProps<P>,
    {}
  > {
    public className: string | null;
    public component: AnyComponent<JsxstyleProps<P>>;

    constructor(props: JsxstyleProps<P>) {
      super(props);
      this.component = props.component || tagName;
      this.className = cache.getClassName(props, props.class);
    }

    static defaultProps = defaultProps;
    static displayName = displayName;

    componentWillReceiveProps(props: JsxstyleProps<P>) {
      this.component = props.component || tagName;
      this.className = cache.getClassName(props, props.class);
    }

    render(props: JsxstyleProps<P>) {
      return (
        <this.component
          {...props.props}
          class={this.className}
          style={props.style}
        >
          {props.children}
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
