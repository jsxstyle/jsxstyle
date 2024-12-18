import type { JsxstyleAnimation, JsxstyleComponentStyleProps } from '../types';

interface ExampleElementProps {
  /** JSDoc comment 1 */
  disabled?: boolean;
  /** JSDoc comment 2 */
  href?: string;
}

declare module '@jsxstyle/core' {
  interface JsxstyleComponentStyleProps {
    hoverMarginLeft?: number;
    activeMarginV?: number;
    placeholderPaddingV?: number;
    placeholderPadding?: number;
    placeholderPaddingTop?: number;
    placeholderHoverColor?: number;
    hoverAnimation?: JsxstyleAnimation;
  }
}

export const kitchenSink: JsxstyleComponentStyleProps & ExampleElementProps = {
  disabled: true,
  href: 'https://jsx.style',
  margin: 1,
  marginH: 2,
  marginLeft: 3,
  hoverMarginLeft: 4,
  activeMarginV: 5,
  placeholderPaddingV: 6,
  placeholderPadding: 7,
  placeholderPaddingTop: 8,
  placeholderHoverColor: 9,
  animation: {
    from: { color: 'red', paddingH: 69 },
    to: { marginV: 123, margin: 456 },
  },
  hoverAnimation: {
    test: { margin: 456, marginV: 123 },
  },
};
