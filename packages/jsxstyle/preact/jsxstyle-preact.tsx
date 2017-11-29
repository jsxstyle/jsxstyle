import * as preact from 'preact';
import { Dict, getStyleCache, componentStyles } from 'jsxstyle-utils';

import CSSProperties from '../CSSProperties';

export const cache = getStyleCache();

export interface StyleProps {
  class?: string;
  style?: any;
}

export type AnyComponent<Props extends StyleProps> =
  | keyof JSX.IntrinsicElements
  | preact.AnyComponent<Props, any>
  | any; // TODO: figure out why TS complains about a missing "refs" prop

export type JsxstyleProps<ComponentProps> = {
  component?: AnyComponent<ComponentProps>;
  mediaQueries?: Dict<string>;
  props?: ComponentProps & {
    // class and style props cannot be set via the props prop
    class?: undefined;
    style?: undefined;
  };
} & StyleProps &
  CSSProperties;

// TODO: add decent return type
function factory(displayName: string, defaultProps?: {}): any {
  const tagName = 'div';

  return class JsxstyleComponent<P> extends preact.Component<
    JsxstyleProps<P>,
    any
  > {
    className: string | null;
    component: AnyComponent<JsxstyleProps<P>>;

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

    render({ style, props, children }: JsxstyleProps<P>) {
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
