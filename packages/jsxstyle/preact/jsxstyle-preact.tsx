import * as preact from 'preact';
import { getStyleCache, componentStyles } from 'jsxstyle-utils';
import { StyleCache } from 'jsxstyle-utils/src/getStyleCache';

import { CSSProperties } from '../cssproperties';

export const cache: StyleCache = getStyleCache();

export interface ComponentPropProps {
  className?: any;
  style?: any;
  [key: string]: any;
}

export type ComponentProp =
  | keyof JSX.IntrinsicElements
  | preact.AnyComponent<any, any>
  | any;

export interface JsxstyleProps extends CSSProperties {
  className?: string;
  component?: keyof JSX.IntrinsicElements | React.ComponentClass | React.SFC;
  mediaQueries?: { [key: string]: string };
  props?: { [key: string]: any };
  style?: string;
  children: (JSX.Element | JSX.Element[] | string)[];
}

function factory(displayName: string, defaultProps?: {}) {
  const tagName = 'div';

  return class JsxstyleComponent extends preact.Component<JsxstyleProps, {}> {
    className: string | { [key: string]: boolean };
    component: ComponentProp;

    constructor(props: JsxstyleProps) {
      super(props);
      this.component = props.component || tagName;
      this.className = cache.getClassName(props, props.class);
    }

    static defaultProps = defaultProps;
    static displayName = displayName;

    componentWillReceiveProps(props: JsxstyleProps) {
      this.component = props.component || tagName;
      this.className = cache.getClassName(props, props.class);
    }

    render(props: JsxstyleProps) {
      const { style, props: _props, children } = props;
      return (
        <this.component {..._props} class={this.className} style={style}>
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
