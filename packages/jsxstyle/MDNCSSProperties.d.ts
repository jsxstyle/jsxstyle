/* CSSProperties generated from MDN data */
interface MDNCSSProperties {
  /**
   * Syntax: flex-start | flex-end | center | space-between | space-around | space-evenly | stretch
   * Status: standard
   */
  alignContent?:
    | "flex-start"
    | "flex-end"
    | "center"
    | "space-between"
    | "space-around"
    | "space-evenly"
    | "stretch";

  /**
   * Syntax: flex-start | flex-end | center | baseline | stretch
   * Status: standard
   */
  alignItems?: "flex-start" | "flex-end" | "center" | "baseline" | "stretch";

  /**
   * Syntax: auto | flex-start | flex-end | center | baseline | stretch
   * Status: standard
   */
  alignSelf?:
    | "auto"
    | "flex-start"
    | "flex-end"
    | "center"
    | "baseline"
    | "stretch";

  /**
   * Syntax: initial | inherit | unset | revert
   * Status: standard
   */
  all?: "initial" | "inherit" | "unset" | "revert";

  /**
   * Syntax: <single-animation>#
   * Status: standard
   * Shorthand for animation-name, animation-duration, animation-timing-function, animation-delay, animation-direction, animation-iteration-count, animation-fill-mode, and animation-play-state
   */
  animation?: any;

  /**
   * Syntax: <time>#
   * Status: standard
   */
  animationDelay?: any;

  /**
   * Syntax: <single-animation-direction>#
   * Status: standard
   */
  animationDirection?: any;

  /**
   * Syntax: <time>#
   * Status: standard
   */
  animationDuration?: any;

  /**
   * Syntax: <single-animation-fill-mode>#
   * Status: standard
   */
  animationFillMode?: any;

  /**
   * Syntax: <single-animation-iteration-count>#
   * Status: standard
   */
  animationIterationCount?: any;

  /**
   * Syntax: [ none | <keyframes-name> ]#
   * Status: standard
   */
  animationName?: any;

  /**
   * Syntax: <single-animation-play-state>#
   * Status: standard
   */
  animationPlayState?: any;

  /**
   * Syntax: <single-timing-function>#
   * Status: standard
   */
  animationTimingFunction?: any;

  /**
   * Syntax: auto | none
   * Status: experimental
   */
  appearance?: "auto" | "none";

  /**
   * Syntax: <angle> | [ [ left-side | far-left | left | center-left | center | center-right | right | far-right | right-side ] || behind ] | leftwards | rightwards
   * Status: obsolete
   */
  azimuth?: any;

  /**
   * Syntax: none | <filter-function-list>
   * Status: experimental
   */
  backdropFilter?: any;

  /**
   * Syntax: visible | hidden
   * Status: standard
   */
  backfaceVisibility?: "visible" | "hidden";

  /**
   * Syntax: [ <bg-layer> , ]* <final-bg-layer>
   * Status: standard
   * Shorthand for background-image, background-position, background-size, background-repeat, background-origin, background-clip, background-attachment, and background-color
   */
  background?: any;

  /**
   * Syntax: <attachment>#
   * Status: standard
   */
  backgroundAttachment?: any;

  /**
   * Syntax: <blend-mode>#
   * Status: standard
   */
  backgroundBlendMode?: any;

  /**
   * Syntax: <box>#
   * Status: standard
   */
  backgroundClip?: any;

  /**
   * Syntax: <color>
   * Status: standard
   */
  backgroundColor?: any;

  /**
   * Syntax: <bg-image>#
   * Status: standard
   */
  backgroundImage?: any;

  /**
   * Syntax: <box>#
   * Status: standard
   */
  backgroundOrigin?: any;

  /**
   * Syntax: <position>#
   * Status: standard
   */
  backgroundPosition?: any;

  /**
   * Syntax: [ center | [ left | right | x-start | x-end ]? <length-percentage>? ]#
   * Status: experimental
   */
  backgroundPositionX?: any;

  /**
   * Syntax: [ center | [ top | bottom | y-start | y-end ]? <length-percentage>? ]#
   * Status: experimental
   */
  backgroundPositionY?: any;

  /**
   * Syntax: <repeat-style>#
   * Status: standard
   */
  backgroundRepeat?: any;

  /**
   * Syntax: <bg-size>#
   * Status: standard
   */
  backgroundSize?: any;

  /**
   * Syntax: <'width'>
   * Status: standard
   */
  blockSize?: any;

  /**
   * Syntax: <br-width> || <br-style> || <color>
   * Status: standard
   * Shorthand for border-width, border-style, and border-color
   */
  border?: any;

  /**
   * Syntax: <'border-width'> || <'border-style'> || <'color'>
   * Status: standard
   * Shorthand for border-width, border-style, and border-block-end-color
   */
  borderBlockEnd?: any;

  /**
   * Syntax: <'color'>
   * Status: standard
   */
  borderBlockEndColor?: any;

  /**
   * Syntax: <'border-style'>
   * Status: standard
   */
  borderBlockEndStyle?: any;

  /**
   * Syntax: <'border-width'>
   * Status: standard
   */
  borderBlockEndWidth?: any;

  /**
   * Syntax: <'border-width'> || <'border-style'> || <'color'>
   * Status: standard
   * Shorthand for border-width, border-style, and border-block-start-color
   */
  borderBlockStart?: any;

  /**
   * Syntax: <'color'>
   * Status: standard
   */
  borderBlockStartColor?: any;

  /**
   * Syntax: <'border-style'>
   * Status: standard
   */
  borderBlockStartStyle?: any;

  /**
   * Syntax: <'border-width'>
   * Status: standard
   */
  borderBlockStartWidth?: any;

  /**
   * Syntax: <br-width> || <br-style> || <color>
   * Status: standard
   * Shorthand for border-bottom-width, border-bottom-style, and border-bottom-color
   */
  borderBottom?: any;

  /**
   * Syntax: <color>
   * Status: standard
   */
  borderBottomColor?: any;

  /**
   * Syntax: <length-percentage>{1,2}
   * Status: standard
   */
  borderBottomLeftRadius?: any;

  /**
   * Syntax: <length-percentage>{1,2}
   * Status: standard
   */
  borderBottomRightRadius?: any;

  /**
   * Syntax: <br-style>
   * Status: standard
   */
  borderBottomStyle?: any;

  /**
   * Syntax: <br-width>
   * Status: standard
   */
  borderBottomWidth?: any;

  /**
   * Syntax: collapse | separate
   * Status: standard
   */
  borderCollapse?: "collapse" | "separate";

  /**
   * Syntax: <color>{1,4}
   * Status: standard
   * Shorthand for border-bottom-color, border-left-color, border-right-color, and border-top-color
   */
  borderColor?: any;

  /**
   * Syntax: <'border-image-source'> || <'border-image-slice'> [ / <'border-image-width'> | / <'border-image-width'>? / <'border-image-outset'> ]? || <'border-image-repeat'>
   * Status: standard
   * Shorthand for border-image-outset, border-image-repeat, border-image-slice, border-image-source, and border-image-width
   */
  borderImage?: any;

  /**
   * Syntax: [ <length> | <number> ]{1,4}
   * Status: standard
   */
  borderImageOutset?: any;

  /**
   * Syntax: [ stretch | repeat | round | space ]{1,2}
   * Status: standard
   */
  borderImageRepeat?: any;

  /**
   * Syntax: <number-percentage>{1,4} && fill?
   * Status: standard
   */
  borderImageSlice?: any;

  /**
   * Syntax: none | <image>
   * Status: standard
   */
  borderImageSource?: any;

  /**
   * Syntax: [ <length-percentage> | <number> | auto ]{1,4}
   * Status: standard
   */
  borderImageWidth?: any;

  /**
   * Syntax: <'border-width'> || <'border-style'> || <'color'>
   * Status: standard
   * Shorthand for border-width, border-style, and border-inline-end-color
   */
  borderInlineEnd?: any;

  /**
   * Syntax: <'color'>
   * Status: standard
   */
  borderInlineEndColor?: any;

  /**
   * Syntax: <'border-style'>
   * Status: standard
   */
  borderInlineEndStyle?: any;

  /**
   * Syntax: <'border-width'>
   * Status: standard
   */
  borderInlineEndWidth?: any;

  /**
   * Syntax: <'border-width'> || <'border-style'> || <'color'>
   * Status: standard
   * Shorthand for border-width, border-style, and border-inline-start-color
   */
  borderInlineStart?: any;

  /**
   * Syntax: <'color'>
   * Status: standard
   */
  borderInlineStartColor?: any;

  /**
   * Syntax: <'border-style'>
   * Status: standard
   */
  borderInlineStartStyle?: any;

  /**
   * Syntax: <'border-width'>
   * Status: standard
   */
  borderInlineStartWidth?: any;

  /**
   * Syntax: <br-width> || <br-style> || <color>
   * Status: standard
   * Shorthand for border-left-width, border-left-style, and border-left-color
   */
  borderLeft?: any;

  /**
   * Syntax: <color>
   * Status: standard
   */
  borderLeftColor?: any;

  /**
   * Syntax: <br-style>
   * Status: standard
   */
  borderLeftStyle?: any;

  /**
   * Syntax: <br-width>
   * Status: standard
   */
  borderLeftWidth?: any;

  /**
   * Syntax: <length-percentage>{1,4} [ / <length-percentage>{1,4} ]?
   * Status: standard
   * Shorthand for border-bottom-left-radius, border-bottom-right-radius, border-top-left-radius, and border-top-right-radius
   */
  borderRadius?: any;

  /**
   * Syntax: <br-width> || <br-style> || <color>
   * Status: standard
   * Shorthand for border-right-width, border-right-style, and border-right-color
   */
  borderRight?: any;

  /**
   * Syntax: <color>
   * Status: standard
   */
  borderRightColor?: any;

  /**
   * Syntax: <br-style>
   * Status: standard
   */
  borderRightStyle?: any;

  /**
   * Syntax: <br-width>
   * Status: standard
   */
  borderRightWidth?: any;

  /**
   * Syntax: <length> <length>?
   * Status: standard
   */
  borderSpacing?: any;

  /**
   * Syntax: <br-style>{1,4}
   * Status: standard
   * Shorthand for border-bottom-style, border-left-style, border-right-style, and border-top-style
   */
  borderStyle?: any;

  /**
   * Syntax: <br-width> || <br-style> || <color>
   * Status: standard
   * Shorthand for border-top-width, border-top-style, and border-top-color
   */
  borderTop?: any;

  /**
   * Syntax: <color>
   * Status: standard
   */
  borderTopColor?: any;

  /**
   * Syntax: <length-percentage>{1,2}
   * Status: standard
   */
  borderTopLeftRadius?: any;

  /**
   * Syntax: <length-percentage>{1,2}
   * Status: standard
   */
  borderTopRightRadius?: any;

  /**
   * Syntax: <br-style>
   * Status: standard
   */
  borderTopStyle?: any;

  /**
   * Syntax: <br-width>
   * Status: standard
   */
  borderTopWidth?: any;

  /**
   * Syntax: <br-width>{1,4}
   * Status: standard
   * Shorthand for border-bottom-width, border-left-width, border-right-width, and border-top-width
   */
  borderWidth?: any;

  /**
   * Syntax: <length> | <percentage> | auto
   * Status: standard
   */
  bottom?: any;

  /**
   * Syntax: start | center | end | baseline | stretch
   * Status: nonstandard
   */
  boxAlign?: "start" | "center" | "end" | "baseline" | "stretch";

  /**
   * Syntax: slice | clone
   * Status: standard
   */
  boxDecorationBreak?: "slice" | "clone";

  /**
   * Syntax: normal | reverse | inherit
   * Status: nonstandard
   */
  boxDirection?: "normal" | "reverse" | "inherit";

  /**
   * Syntax: <number>
   * Status: nonstandard
   */
  boxFlex?: any;

  /**
   * Syntax: <integer>
   * Status: nonstandard
   */
  boxFlexGroup?: any;

  /**
   * Syntax: single | multiple
   * Status: nonstandard
   */
  boxLines?: "single" | "multiple";

  /**
   * Syntax: <integer>
   * Status: nonstandard
   */
  boxOrdinalGroup?: any;

  /**
   * Syntax: horizontal | vertical | inline-axis | block-axis | inherit
   * Status: nonstandard
   */
  boxOrient?:
    | "horizontal"
    | "vertical"
    | "inline-axis"
    | "block-axis"
    | "inherit";

  /**
   * Syntax: start | center | end | justify
   * Status: nonstandard
   */
  boxPack?: "start" | "center" | "end" | "justify";

  /**
   * Syntax: none | <shadow>#
   * Status: standard
   */
  boxShadow?: any;

  /**
   * Syntax: content-box | border-box
   * Status: standard
   */
  boxSizing?: "content-box" | "border-box";

  /**
   * Syntax: auto | avoid | avoid-page | page | left | right | recto | verso | avoid-column | column | avoid-region | region
   * Status: standard
   */
  breakAfter?:
    | "auto"
    | "avoid"
    | "avoid-page"
    | "page"
    | "left"
    | "right"
    | "recto"
    | "verso"
    | "avoid-column"
    | "column"
    | "avoid-region"
    | "region";

  /**
   * Syntax: auto | avoid | avoid-page | page | left | right | recto | verso | avoid-column | column | avoid-region | region
   * Status: standard
   */
  breakBefore?:
    | "auto"
    | "avoid"
    | "avoid-page"
    | "page"
    | "left"
    | "right"
    | "recto"
    | "verso"
    | "avoid-column"
    | "column"
    | "avoid-region"
    | "region";

  /**
   * Syntax: auto | avoid | avoid-page | avoid-column | avoid-region
   * Status: standard
   */
  breakInside?:
    | "auto"
    | "avoid"
    | "avoid-page"
    | "avoid-column"
    | "avoid-region";

  /**
   * Syntax: top | bottom | block-start | block-end | inline-start | inline-end
   * Status: standard
   */
  captionSide?:
    | "top"
    | "bottom"
    | "block-start"
    | "block-end"
    | "inline-start"
    | "inline-end";

  /**
   * Syntax: auto | <color>
   * Status: standard
   */
  caretColor?: any;

  /**
   * Syntax: none | left | right | both | inline-start | inline-end
   * Status: standard
   */
  clear?: "none" | "left" | "right" | "both" | "inline-start" | "inline-end";

  /**
   * Syntax: <shape> | auto
   * Status: standard
   */
  clip?: any;

  /**
   * Syntax: <clip-source> | [ <basic-shape> || <geometry-box> ] | none
   * Status: standard
   */
  clipPath?: any;

  /**
   * Syntax: <color>
   * Status: standard
   */
  color?: any;

  /**
   * Syntax: <integer> | auto
   * Status: standard
   */
  columnCount?: any;

  /**
   * Syntax: auto | balance | balance-all
   * Status: standard
   */
  columnFill?: "auto" | "balance" | "balance-all";

  /**
   * Syntax: <length-percentage> | normal
   * Status: standard
   */
  columnGap?: any;

  /**
   * Syntax: <'column-rule-width'> || <'column-rule-style'> || <'column-rule-color'>
   * Status: standard
   * Shorthand for column-rule-color, column-rule-style, and column-rule-width
   */
  columnRule?: any;

  /**
   * Syntax: <color>
   * Status: standard
   */
  columnRuleColor?: any;

  /**
   * Syntax: <'border-style'>
   * Status: standard
   */
  columnRuleStyle?: any;

  /**
   * Syntax: <'border-width'>
   * Status: standard
   */
  columnRuleWidth?: any;

  /**
   * Syntax: none | all
   * Status: standard
   */
  columnSpan?: "none" | "all";

  /**
   * Syntax: <length> | auto
   * Status: standard
   */
  columnWidth?: any;

  /**
   * Syntax: <'column-width'> || <'column-count'>
   * Status: standard
   * Shorthand for column-width and column-count
   */
  columns?: any;

  /**
   * Syntax: none | strict | content | [ size || layout || style || paint ]
   * Status: experimental
   */
  contain?: any;

  /**
   * Syntax: normal | none | [ <content-replacement> | <content-list> ] [/ <string> ]?
   * Status: standard
   */
  content?: any;

  /**
   * Syntax: [ <custom-ident> <integer>? ]+ | none
   * Status: standard
   */
  counterIncrement?: any;

  /**
   * Syntax: [ <custom-ident> <integer>? ]+ | none
   * Status: standard
   */
  counterReset?: any;

  /**
   * Syntax: [ [ <url> [ <x> <y> ]? , ]* [ auto | default | none | context-menu | help | pointer | progress | wait | cell | crosshair | text | vertical-text | alias | copy | move | no-drop | not-allowed | e-resize | n-resize | ne-resize | nw-resize | s-resize | se-resize | sw-resize | w-resize | ew-resize | ns-resize | nesw-resize | nwse-resize | col-resize | row-resize | all-scroll | zoom-in | zoom-out | grab | grabbing ] ]
   * Status: standard
   */
  cursor?: any;

  /**
   * Syntax: ltr | rtl
   * Status: standard
   */
  direction?: "ltr" | "rtl";

  /**
   * Syntax: [ <display-outside> || <display-inside> ] | <display-listitem> | <display-internal> | <display-box> | <display-legacy>
   * Status: standard
   */
  display?: any;

  /**
   * Syntax: auto | block | table | flex | grid | ruby
   * Status: experimental
   */
  displayInside?: "auto" | "block" | "table" | "flex" | "grid" | "ruby";

  /**
   * Syntax: none | list-item
   * Status: experimental
   */
  displayList?: "none" | "list-item";

  /**
   * Syntax: block-level | inline-level | run-in | contents | none | table-row-group | table-header-group | table-footer-group | table-row | table-cell | table-column-group | table-column | table-caption | ruby-base | ruby-text | ruby-base-container | ruby-text-container
   * Status: experimental
   */
  displayOutside?:
    | "block-level"
    | "inline-level"
    | "run-in"
    | "contents"
    | "none"
    | "table-row-group"
    | "table-header-group"
    | "table-footer-group"
    | "table-row"
    | "table-cell"
    | "table-column-group"
    | "table-column"
    | "table-caption"
    | "ruby-base"
    | "ruby-text"
    | "ruby-base-container"
    | "ruby-text-container";

  /**
   * Syntax: show | hide
   * Status: standard
   */
  emptyCells?: "show" | "hide";

  /**
   * Syntax: none | <filter-function-list>
   * Status: standard
   */
  filter?: any;

  /**
   * Syntax: none | [ <'flex-grow'> <'flex-shrink'>? || <'flex-basis'> ]
   * Status: standard
   * Shorthand for flex-grow, flex-shrink, and flex-basis
   */
  flex?: any;

  /**
   * Syntax: content | <'width'>
   * Status: standard
   */
  flexBasis?: any;

  /**
   * Syntax: row | row-reverse | column | column-reverse
   * Status: standard
   */
  flexDirection?: "row" | "row-reverse" | "column" | "column-reverse";

  /**
   * Syntax: <'flex-direction'> || <'flex-wrap'>
   * Status: standard
   * Shorthand for flex-direction and flex-wrap
   */
  flexFlow?: any;

  /**
   * Syntax: <number>
   * Status: standard
   */
  flexGrow?: any;

  /**
   * Syntax: <number>
   * Status: standard
   */
  flexShrink?: any;

  /**
   * Syntax: nowrap | wrap | wrap-reverse
   * Status: standard
   */
  flexWrap?: "nowrap" | "wrap" | "wrap-reverse";

  /**
   * Syntax: left | right | none | inline-start | inline-end
   * Status: standard
   */
  float?: "left" | "right" | "none" | "inline-start" | "inline-end";

  /**
   * Syntax: [ [ <'font-style'> || <font-variant-css21> || <'font-weight'> || <'font-stretch'> ]? <'font-size'> [ / <'line-height'> ]? <'font-family'> ] | caption | icon | menu | message-box | small-caption | status-bar
   * Status: standard
   * Shorthand for font-style, font-variant, font-weight, font-stretch, font-size, line-height, and font-family
   */
  font?: any;

  /**
   * Syntax: [ <family-name> | <generic-family> ]#
   * Status: standard
   */
  fontFamily?: any;

  /**
   * Syntax: normal | <feature-tag-value>#
   * Status: standard
   */
  fontFeatureSettings?: any;

  /**
   * Syntax: auto | normal | none
   * Status: standard
   */
  fontKerning?: "auto" | "normal" | "none";

  /**
   * Syntax: normal | <string>
   * Status: standard
   */
  fontLanguageOverride?: any;

  /**
   * Syntax: normal | [ <string> <number> ]#
   * Status: experimental
   */
  fontVariationSettings?: any;

  /**
   * Syntax: <absolute-size> | <relative-size> | <length-percentage>
   * Status: standard
   */
  fontSize?: any;

  /**
   * Syntax: none | <number>
   * Status: standard
   */
  fontSizeAdjust?: any;

  /**
   * Syntax: normal | ultra-condensed | extra-condensed | condensed | semi-condensed | semi-expanded | expanded | extra-expanded | ultra-expanded
   * Status: standard
   */
  fontStretch?:
    | "normal"
    | "ultra-condensed"
    | "extra-condensed"
    | "condensed"
    | "semi-condensed"
    | "semi-expanded"
    | "expanded"
    | "extra-expanded"
    | "ultra-expanded";

  /**
   * Syntax: normal | italic | oblique
   * Status: standard
   */
  fontStyle?: "normal" | "italic" | "oblique";

  /**
   * Syntax: none | [ weight || style ]
   * Status: standard
   */
  fontSynthesis?: any;

  /**
   * Syntax: normal | none | [ <common-lig-values> || <discretionary-lig-values> || <historical-lig-values> || <contextual-alt-values> || stylistic( <feature-value-name> ) || historical-forms || styleset( <feature-value-name># ) || character-variant( <feature-value-name># ) || swash( <feature-value-name> ) || ornaments( <feature-value-name> ) || annotation( <feature-value-name> ) || [ small-caps | all-small-caps | petite-caps | all-petite-caps | unicase | titling-caps ] || <numeric-figure-values> || <numeric-spacing-values> || <numeric-fraction-values> || ordinal || slashed-zero || <east-asian-variant-values> || <east-asian-width-values> || ruby ]
   * Status: standard
   */
  fontVariant?: any;

  /**
   * Syntax: normal | [ stylistic( <feature-value-name> ) || historical-forms || styleset( <feature-value-name># ) || character-variant( <feature-value-name># ) || swash( <feature-value-name> ) || ornaments( <feature-value-name> ) || annotation( <feature-value-name> ) ]
   * Status: standard
   */
  fontVariantAlternates?: any;

  /**
   * Syntax: normal | small-caps | all-small-caps | petite-caps | all-petite-caps | unicase | titling-caps
   * Status: standard
   */
  fontVariantCaps?:
    | "normal"
    | "small-caps"
    | "all-small-caps"
    | "petite-caps"
    | "all-petite-caps"
    | "unicase"
    | "titling-caps";

  /**
   * Syntax: normal | [ <east-asian-variant-values> || <east-asian-width-values> || ruby ]
   * Status: standard
   */
  fontVariantEastAsian?: any;

  /**
   * Syntax: normal | none | [ <common-lig-values> || <discretionary-lig-values> || <historical-lig-values> || <contextual-alt-values> ]
   * Status: standard
   */
  fontVariantLigatures?: any;

  /**
   * Syntax: normal | [ <numeric-figure-values> || <numeric-spacing-values> || <numeric-fraction-values> || ordinal || slashed-zero ]
   * Status: standard
   */
  fontVariantNumeric?: any;

  /**
   * Syntax: normal | sub | super
   * Status: standard
   */
  fontVariantPosition?: "normal" | "sub" | "super";

  /**
   * Syntax: normal | bold | bolder | lighter | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900
   * Status: standard
   */
  fontWeight?: any;

  /**
   * Syntax: <'grid-template'> | <'grid-template-rows'> / [ auto-flow && dense? ] <'grid-auto-columns'>? | [ auto-flow && dense? ] <'grid-auto-rows'>? / <'grid-template-columns'>
   * Status: standard
   * Shorthand for grid-template-rows, grid-template-columns, grid-template-areas, grid-auto-rows, grid-auto-columns, grid-auto-flow, grid-column-gap, and grid-row-gap
   */
  grid?: any;

  /**
   * Syntax: <grid-line> [ / <grid-line> ]{0,3}
   * Status: standard
   * Shorthand for grid-row-start, grid-column-start, grid-row-end, and grid-column-end
   */
  gridArea?: any;

  /**
   * Syntax: <track-size>+
   * Status: standard
   */
  gridAutoColumns?: any;

  /**
   * Syntax: [ row | column ] || dense
   * Status: standard
   */
  gridAutoFlow?: any;

  /**
   * Syntax: <track-size>+
   * Status: standard
   */
  gridAutoRows?: any;

  /**
   * Syntax: <grid-line> [ / <grid-line> ]?
   * Status: standard
   * Shorthand for grid-column-start and grid-column-end
   */
  gridColumn?: any;

  /**
   * Syntax: <grid-line>
   * Status: standard
   */
  gridColumnEnd?: any;

  /**
   * Syntax: <length-percentage>
   * Status: standard
   */
  gridColumnGap?: any;

  /**
   * Syntax: <grid-line>
   * Status: standard
   */
  gridColumnStart?: any;

  /**
   * Syntax: <'grid-row-gap'> <'grid-column-gap'>?
   * Status: standard
   * Shorthand for grid-row-gap and grid-column-gap
   */
  gridGap?: any;

  /**
   * Syntax: <grid-line> [ / <grid-line> ]?
   * Status: standard
   * Shorthand for grid-row-start and grid-row-end
   */
  gridRow?: any;

  /**
   * Syntax: <grid-line>
   * Status: standard
   */
  gridRowEnd?: any;

  /**
   * Syntax: <length-percentage>
   * Status: standard
   */
  gridRowGap?: any;

  /**
   * Syntax: <grid-line>
   * Status: standard
   */
  gridRowStart?: any;

  /**
   * Syntax: none | [ <'grid-template-rows'> / <'grid-template-columns'> ] | [ <line-names>? <string> <track-size>? <line-names>? ]+ [ / <explicit-track-list> ]?
   * Status: standard
   * Shorthand for grid-template-columns, grid-template-rows, and grid-template-areas
   */
  gridTemplate?: any;

  /**
   * Syntax: none | <string>+
   * Status: standard
   */
  gridTemplateAreas?: any;

  /**
   * Syntax: none | <track-list> | <auto-track-list>
   * Status: standard
   */
  gridTemplateColumns?: any;

  /**
   * Syntax: none | <track-list> | <auto-track-list>
   * Status: standard
   */
  gridTemplateRows?: any;

  /**
   * Syntax: none | [ first || [ force-end | allow-end ] || last ]
   * Status: standard
   */
  hangingPunctuation?: any;

  /**
   * Syntax: [ <length> | <percentage> ] && [ border-box | content-box ]? | available | min-content | max-content | fit-content | auto
   * Status: standard
   */
  height?: any;

  /**
   * Syntax: none | manual | auto
   * Status: standard
   */
  hyphens?: "none" | "manual" | "auto";

  /**
   * Syntax: from-image | <angle> | [ <angle>? flip ]
   * Status: standard
   */
  imageOrientation?: any;

  /**
   * Syntax: auto | crisp-edges | pixelated
   * Status: standard
   */
  imageRendering?: "auto" | "crisp-edges" | "pixelated";

  /**
   * Syntax: [ from-image || <resolution> ] && snap?
   * Status: standard
   */
  imageResolution?: any;

  /**
   * Syntax: auto | normal | active | inactive | disabled
   * Status: obsolete
   */
  imeMode?: "auto" | "normal" | "active" | "inactive" | "disabled";

  /**
   * Syntax: normal | [ <number> <integer>? ]
   * Status: experimental
   */
  initialLetter?: any;

  /**
   * Syntax: [ auto | alphabetic | hanging | ideographic ]
   * Status: experimental
   */
  initialLetterAlign?: any;

  /**
   * Syntax: <'width'>
   * Status: standard
   */
  inlineSize?: any;

  /**
   * Syntax: auto | isolate
   * Status: standard
   */
  isolation?: "auto" | "isolate";

  /**
   * Syntax: flex-start | flex-end | center | space-between | space-around | space-evenly
   * Status: standard
   */
  justifyContent?:
    | "flex-start"
    | "flex-end"
    | "center"
    | "space-between"
    | "space-around"
    | "space-evenly";

  /**
   * Syntax: <length> | <percentage> | auto
   * Status: standard
   */
  left?: any;

  /**
   * Syntax: normal | <length>
   * Status: standard
   */
  letterSpacing?: any;

  /**
   * Syntax: auto | loose | normal | strict
   * Status: standard
   */
  lineBreak?: "auto" | "loose" | "normal" | "strict";

  /**
   * Syntax: normal | <number> | <length> | <percentage>
   * Status: standard
   */
  lineHeight?: any;

  /**
   * Syntax:  none | <length>
   * Status: experimental
   */
  lineHeightStep?: any;

  /**
   * Syntax: <'list-style-type'> || <'list-style-position'> || <'list-style-image'>
   * Status: standard
   * Shorthand for list-style-image, list-style-position, and list-style-type
   */
  listStyle?: any;

  /**
   * Syntax: <url> | none
   * Status: standard
   */
  listStyleImage?: any;

  /**
   * Syntax: inside | outside
   * Status: standard
   */
  listStylePosition?: "inside" | "outside";

  /**
   * Syntax: <counter-style> | <string> | none
   * Status: standard
   */
  listStyleType?: any;

  /**
   * Syntax: [ <length> | <percentage> | auto ]{1,4}
   * Status: standard
   * Shorthand for margin-bottom, margin-left, margin-right, and margin-top
   */
  margin?: any;

  /**
   * Syntax: <'margin-left'>
   * Status: standard
   */
  marginBlockEnd?: any;

  /**
   * Syntax: <'margin-left'>
   * Status: standard
   */
  marginBlockStart?: any;

  /**
   * Syntax: <length> | <percentage> | auto
   * Status: standard
   */
  marginBottom?: any;

  /**
   * Syntax: <'margin-left'>
   * Status: standard
   */
  marginInlineEnd?: any;

  /**
   * Syntax: <'margin-left'>
   * Status: standard
   */
  marginInlineStart?: any;

  /**
   * Syntax: <length> | <percentage> | auto
   * Status: standard
   */
  marginLeft?: any;

  /**
   * Syntax: <length> | <percentage> | auto
   * Status: standard
   */
  marginRight?: any;

  /**
   * Syntax: <length> | <percentage> | auto
   * Status: standard
   */
  marginTop?: any;

  /**
   * Syntax: <mask-layer>#
   * Status: standard
   * Shorthand for mask-image, mask-mode, mask-repeat, mask-position, mask-clip, mask-origin, mask-size, and mask-composite
   */
  mask?: any;

  /**
   * Syntax: <'mask-border-source'> || <'mask-border-slice'> [ / <'mask-border-width'>? [ / <'mask-border-outset'> ]? ]? || <'mask-border-repeat'> || <'mask-border-mode'>
   * Status: experimental
   * Shorthand for mask-border-mode, mask-border-outset, mask-border-repeat, mask-border-slice, mask-border-source, and mask-border-width
   */
  maskBorder?: any;

  /**
   * Syntax: luminance | alpha
   * Status: experimental
   */
  maskBorderMode?: "luminance" | "alpha";

  /**
   * Syntax: [ <length> | <number> ]{1,4}
   * Status: experimental
   */
  maskBorderOutset?: any;

  /**
   * Syntax: [ stretch | repeat | round | space ]{1,2}
   * Status: experimental
   */
  maskBorderRepeat?: any;

  /**
   * Syntax: <number-percentage>{1,4} fill?
   * Status: experimental
   */
  maskBorderSlice?: any;

  /**
   * Syntax: none | <image>
   * Status: experimental
   */
  maskBorderSource?: any;

  /**
   * Syntax: [ <length-percentage> | <number> | auto ]{1,4}
   * Status: experimental
   */
  maskBorderWidth?: any;

  /**
   * Syntax: [ <geometry-box> | no-clip ]#
   * Status: standard
   */
  maskClip?: any;

  /**
   * Syntax: <compositing-operator>#
   * Status: standard
   */
  maskComposite?: any;

  /**
   * Syntax: <mask-reference>#
   * Status: standard
   */
  maskImage?: any;

  /**
   * Syntax: <masking-mode>#
   * Status: standard
   */
  maskMode?: any;

  /**
   * Syntax: <geometry-box>#
   * Status: standard
   */
  maskOrigin?: any;

  /**
   * Syntax: <position>#
   * Status: standard
   */
  maskPosition?: any;

  /**
   * Syntax: <repeat-style>#
   * Status: standard
   */
  maskRepeat?: any;

  /**
   * Syntax: <bg-size>#
   * Status: standard
   */
  maskSize?: any;

  /**
   * Syntax: luminance | alpha
   * Status: standard
   */
  maskType?: "luminance" | "alpha";

  /**
   * Syntax: <'max-width'>
   * Status: experimental
   */
  maxBlockSize?: any;

  /**
   * Syntax: <length> | <percentage> | none | max-content | min-content | fit-content | fill-available
   * Status: standard
   */
  maxHeight?: any;

  /**
   * Syntax: <'max-width'>
   * Status: experimental
   */
  maxInlineSize?: any;

  /**
   * Syntax: <length> | <percentage> | none | max-content | min-content | fit-content | fill-available
   * Status: standard
   */
  maxWidth?: any;

  /**
   * Syntax: <'min-width'>
   * Status: standard
   */
  minBlockSize?: any;

  /**
   * Syntax: <length> | <percentage> | auto | max-content | min-content | fit-content | fill-available
   * Status: standard
   */
  minHeight?: any;

  /**
   * Syntax: <'min-width'>
   * Status: standard
   */
  minInlineSize?: any;

  /**
   * Syntax: <length> | <percentage> | auto | max-content | min-content | fit-content | fill-available
   * Status: standard
   */
  minWidth?: any;

  /**
   * Syntax: <blend-mode>
   * Status: standard
   */
  mixBlendMode?: any;

  /**
   * Syntax: fill | contain | cover | none | scale-down
   * Status: standard
   */
  objectFit?: "fill" | "contain" | "cover" | "none" | "scale-down";

  /**
   * Syntax: <position>
   * Status: standard
   */
  objectPosition?: any;

  /**
   * Syntax: [ <'offset-position'>? [ <'offset-path'> [ <'offset-distance'> || <'offset-rotate'> ]? ]? ]! [ / <'offset-anchor'> ]?
   * Status: experimental
   * Shorthand for offset-position, offset-path, offset-distance, offset-anchor, and offset-rotate
   */
  offset?: any;

  /**
   * Syntax: auto | <position>
   * Status: experimental
   */
  offsetAnchor?: any;

  /**
   * Syntax: <'left'>
   * Status: standard
   */
  offsetBlockEnd?: any;

  /**
   * Syntax: <'left'>
   * Status: standard
   */
  offsetBlockStart?: any;

  /**
   * Syntax: <'left'>
   * Status: standard
   */
  offsetInlineEnd?: any;

  /**
   * Syntax: <'left'>
   * Status: standard
   */
  offsetInlineStart?: any;

  /**
   * Syntax: <length-percentage>
   * Status: experimental
   */
  offsetDistance?: any;

  /**
   * Syntax: none | ray( [ <angle> && <size>? && contain? ] ) | <path()> | <url> | [ <basic-shape> || <geometry-box> ]
   * Status: experimental
   */
  offsetPath?: any;

  /**
   * Syntax: auto | <position>
   * Status: experimental
   */
  offsetPosition?: any;

  /**
   * Syntax: [ auto | reverse ] || <angle>
   * Status: experimental
   */
  offsetRotate?: any;

  /**
   * Syntax: <number>
   * Status: standard
   */
  opacity?: any;

  /**
   * Syntax: <integer>
   * Status: standard
   */
  order?: any;

  /**
   * Syntax: <integer>
   * Status: standard
   */
  orphans?: any;

  /**
   * Syntax: [ <'outline-color'> || <'outline-style'> || <'outline-width'> ]
   * Status: standard
   * Shorthand for outline-color, outline-width, and outline-style
   */
  outline?: any;

  /**
   * Syntax: <color> | invert
   * Status: standard
   */
  outlineColor?: any;

  /**
   * Syntax: <length>
   * Status: standard
   */
  outlineOffset?: any;

  /**
   * Syntax: auto | <br-style>
   * Status: standard
   */
  outlineStyle?: any;

  /**
   * Syntax: <br-width>
   * Status: standard
   */
  outlineWidth?: any;

  /**
   * Syntax: visible | hidden | scroll | auto
   * Status: standard
   */
  overflow?: "visible" | "hidden" | "scroll" | "auto";

  /**
   * Syntax: padding-box | content-box
   * Status: nonstandard
   */
  overflowClipBox?: "padding-box" | "content-box";

  /**
   * Syntax: normal | break-word
   * Status: standard
   */
  overflowWrap?: "normal" | "break-word";

  /**
   * Syntax: visible | hidden | scroll | auto
   * Status: standard
   */
  overflowX?: "visible" | "hidden" | "scroll" | "auto";

  /**
   * Syntax: visible | hidden | scroll | auto
   * Status: standard
   */
  overflowY?: "visible" | "hidden" | "scroll" | "auto";

  /**
   * Syntax: [ <length> | <percentage> ]{1,4}
   * Status: standard
   * Shorthand for padding-bottom, padding-left, padding-right, and padding-top
   */
  padding?: any;

  /**
   * Syntax: <'padding-left'>
   * Status: standard
   */
  paddingBlockEnd?: any;

  /**
   * Syntax: <'padding-left'>
   * Status: standard
   */
  paddingBlockStart?: any;

  /**
   * Syntax: <length> | <percentage>
   * Status: standard
   */
  paddingBottom?: any;

  /**
   * Syntax: <'padding-left'>
   * Status: standard
   */
  paddingInlineEnd?: any;

  /**
   * Syntax: <'padding-left'>
   * Status: standard
   */
  paddingInlineStart?: any;

  /**
   * Syntax: <length> | <percentage>
   * Status: standard
   */
  paddingLeft?: any;

  /**
   * Syntax: <length> | <percentage>
   * Status: standard
   */
  paddingRight?: any;

  /**
   * Syntax: <length> | <percentage>
   * Status: standard
   */
  paddingTop?: any;

  /**
   * Syntax: auto | always | avoid | left | right
   * Status: standard
   */
  pageBreakAfter?: "auto" | "always" | "avoid" | "left" | "right";

  /**
   * Syntax: auto | always | avoid | left | right
   * Status: standard
   */
  pageBreakBefore?: "auto" | "always" | "avoid" | "left" | "right";

  /**
   * Syntax: auto | avoid
   * Status: standard
   */
  pageBreakInside?: "auto" | "avoid";

  /**
   * Syntax: none | <length>
   * Status: standard
   */
  perspective?: any;

  /**
   * Syntax: <position>
   * Status: standard
   */
  perspectiveOrigin?: any;

  /**
   * Syntax: auto | none | visiblePainted | visibleFill | visibleStroke | visible | painted | fill | stroke | all | inherit
   * Status: standard
   */
  pointerEvents?: any;

  /**
   * Syntax: static | relative | absolute | sticky | fixed
   * Status: standard
   */
  position?: "static" | "relative" | "absolute" | "sticky" | "fixed";

  /**
   * Syntax: none | [ <string> <string> ]+
   * Status: standard
   */
  quotes?: any;

  /**
   * Syntax: none | both | horizontal | vertical
   * Status: standard
   */
  resize?: "none" | "both" | "horizontal" | "vertical";

  /**
   * Syntax: <length> | <percentage> | auto
   * Status: standard
   */
  right?: any;

  /**
   * Syntax: start | center | space-between | space-around
   * Status: standard
   */
  rubyAlign?: "start" | "center" | "space-between" | "space-around";

  /**
   * Syntax: separate | collapse | auto
   * Status: standard
   */
  rubyMerge?: "separate" | "collapse" | "auto";

  /**
   * Syntax: over | under | inter-character
   * Status: standard
   */
  rubyPosition?: "over" | "under" | "inter-character";

  /**
   * Syntax: auto | smooth
   * Status: standard
   */
  scrollBehavior?: "auto" | "smooth";

  /**
   * Syntax: none | <position>#
   * Status: standard
   */
  scrollSnapCoordinate?: any;

  /**
   * Syntax: <position>
   * Status: standard
   */
  scrollSnapDestination?: any;

  /**
   * Syntax: none | repeat( <length-percentage> )
   * Status: obsolete
   */
  scrollSnapPointsX?: any;

  /**
   * Syntax: none | repeat( <length-percentage> )
   * Status: obsolete
   */
  scrollSnapPointsY?: any;

  /**
   * Syntax: none | mandatory | proximity
   * Status: standard
   */
  scrollSnapType?: "none" | "mandatory" | "proximity";

  /**
   * Syntax: none | mandatory | proximity
   * Status: nonstandard
   */
  scrollSnapTypeX?: "none" | "mandatory" | "proximity";

  /**
   * Syntax: none | mandatory | proximity
   * Status: nonstandard
   */
  scrollSnapTypeY?: "none" | "mandatory" | "proximity";

  /**
   * Syntax: <number>
   * Status: standard
   */
  shapeImageThreshold?: any;

  /**
   * Syntax: <length-percentage>
   * Status: standard
   */
  shapeMargin?: any;

  /**
   * Syntax: none | <shape-box> || <basic-shape> | <image>
   * Status: standard
   */
  shapeOutside?: any;

  /**
   * Syntax: <integer> | <length>
   * Status: standard
   */
  tabSize?: any;

  /**
   * Syntax: auto | fixed
   * Status: standard
   */
  tableLayout?: "auto" | "fixed";

  /**
   * Syntax: start | end | left | right | center | justify | match-parent
   * Status: standard
   */
  textAlign?:
    | "start"
    | "end"
    | "left"
    | "right"
    | "center"
    | "justify"
    | "match-parent";

  /**
   * Syntax: auto | start | end | left | right | center | justify
   * Status: standard
   */
  textAlignLast?:
    | "auto"
    | "start"
    | "end"
    | "left"
    | "right"
    | "center"
    | "justify";

  /**
   * Syntax: none | all | [ digits <integer>? ]
   * Status: standard
   */
  textCombineUpright?: any;

  /**
   * Syntax: <'text-decoration-line'> || <'text-decoration-style'> || <'text-decoration-color'>
   * Status: standard
   * Shorthand for text-decoration-line, text-decoration-style, and text-decoration-color
   */
  textDecoration?: any;

  /**
   * Syntax: <color>
   * Status: standard
   */
  textDecorationColor?: any;

  /**
   * Syntax: none | [ underline || overline || line-through || blink ]
   * Status: standard
   */
  textDecorationLine?: any;

  /**
   * Syntax: none | [ objects || [ spaces | [ leading-spaces || trailing-spaces ] ] || edges || box-decoration ]
   * Status: experimental
   */
  textDecorationSkip?: any;

  /**
   * Syntax: auto | none
   * Status: experimental
   */
  textDecorationSkipInk?: "auto" | "none";

  /**
   * Syntax: solid | double | dotted | dashed | wavy
   * Status: standard
   */
  textDecorationStyle?: "solid" | "double" | "dotted" | "dashed" | "wavy";

  /**
   * Syntax: <'text-emphasis-style'> || <'text-emphasis-color'>
   * Status: standard
   * Shorthand for text-emphasis-style and text-emphasis-color
   */
  textEmphasis?: any;

  /**
   * Syntax: <color>
   * Status: standard
   */
  textEmphasisColor?: any;

  /**
   * Syntax: [ over | under ] && [ right | left ]
   * Status: standard
   */
  textEmphasisPosition?: any;

  /**
   * Syntax: none | [ [ filled | open ] || [ dot | circle | double-circle | triangle | sesame ] ] | <string>
   * Status: standard
   */
  textEmphasisStyle?: any;

  /**
   * Syntax: <length-percentage> && hanging? && each-line?
   * Status: standard
   */
  textIndent?: any;

  /**
   * Syntax: auto | inter-character | inter-word | none
   * Status: standard
   */
  textJustify?: "auto" | "inter-character" | "inter-word" | "none";

  /**
   * Syntax: mixed | upright | sideways
   * Status: standard
   */
  textOrientation?: "mixed" | "upright" | "sideways";

  /**
   * Syntax: [ clip | ellipsis | <string> ]{1,2}
   * Status: standard
   */
  textOverflow?: any;

  /**
   * Syntax: auto | optimizeSpeed | optimizeLegibility | geometricPrecision
   * Status: standard
   */
  textRendering?: any;

  /**
   * Syntax: none | <shadow-t>#
   * Status: standard
   */
  textShadow?: any;

  /**
   * Syntax: none | auto | <percentage>
   * Status: experimental
   */
  textSizeAdjust?: any;

  /**
   * Syntax: none | capitalize | uppercase | lowercase | full-width
   * Status: standard
   */
  textTransform?:
    | "none"
    | "capitalize"
    | "uppercase"
    | "lowercase"
    | "full-width";

  /**
   * Syntax: auto | [ under || [ left | right ] ]
   * Status: standard
   */
  textUnderlinePosition?: any;

  /**
   * Syntax: <length> | <percentage> | auto
   * Status: standard
   */
  top?: any;

  /**
   * Syntax: auto | none | [ [ pan-x | pan-left | pan-right ] || [ pan-y | pan-up | pan-down ] || pinch-zoom ] | manipulation
   * Status: standard
   */
  touchAction?: any;

  /**
   * Syntax: none | <transform-list>
   * Status: standard
   */
  transform?: any;

  /**
   * Syntax: border-box | fill-box | view-box
   * Status: standard
   */
  transformBox?: "border-box" | "fill-box" | "view-box";

  /**
   * Syntax: [ <length-percentage> | left | center | right | top | bottom ] | [ [ <length-percentage> | left | center | right ] && [ <length-percentage> | top | center | bottom ] ] <length>?
   * Status: standard
   */
  transformOrigin?: any;

  /**
   * Syntax: flat | preserve-3d
   * Status: standard
   */
  transformStyle?: any;

  /**
   * Syntax: <single-transition>#
   * Status: standard
   * Shorthand for transition-delay, transition-duration, transition-property, and transition-timing-function
   */
  transition?: any;

  /**
   * Syntax: <time>#
   * Status: standard
   */
  transitionDelay?: any;

  /**
   * Syntax: <time>#
   * Status: standard
   */
  transitionDuration?: any;

  /**
   * Syntax: none | <single-transition-property>#
   * Status: standard
   */
  transitionProperty?: any;

  /**
   * Syntax: <single-transition-timing-function>#
   * Status: standard
   */
  transitionTimingFunction?: any;

  /**
   * Syntax: normal | embed | isolate | bidi-override | isolate-override | plaintext
   * Status: standard
   */
  unicodeBidi?:
    | "normal"
    | "embed"
    | "isolate"
    | "bidi-override"
    | "isolate-override"
    | "plaintext";

  /**
   * Syntax: auto | text | none | contain | all
   * Status: nonstandard
   */
  userSelect?: "auto" | "text" | "none" | "contain" | "all";

  /**
   * Syntax: baseline | sub | super | text-top | text-bottom | middle | top | bottom | <percentage> | <length>
   * Status: standard
   */
  verticalAlign?: any;

  /**
   * Syntax: visible | hidden | collapse
   * Status: standard
   */
  visibility?: "visible" | "hidden" | "collapse";

  /**
   * Syntax: normal | pre | nowrap | pre-wrap | pre-line
   * Status: standard
   */
  whiteSpace?: "normal" | "pre" | "nowrap" | "pre-wrap" | "pre-line";

  /**
   * Syntax: <integer>
   * Status: standard
   */
  widows?: any;

  /**
   * Syntax: [ <length> | <percentage> ] && [ border-box | content-box ]? | available | min-content | max-content | fit-content | auto
   * Status: standard
   */
  width?: any;

  /**
   * Syntax: auto | <animateable-feature>#
   * Status: standard
   */
  willChange?: any;

  /**
   * Syntax: normal | break-all | keep-all
   * Status: standard
   */
  wordBreak?: "normal" | "break-all" | "keep-all";

  /**
   * Syntax: normal | <length-percentage>
   * Status: standard
   */
  wordSpacing?: any;

  /**
   * Syntax: normal | break-word
   * Status: standard
   */
  wordWrap?: "normal" | "break-word";

  /**
   * Syntax: horizontal-tb | vertical-rl | vertical-lr | sideways-rl | sideways-lr
   * Status: standard
   */
  writingMode?:
    | "horizontal-tb"
    | "vertical-rl"
    | "vertical-lr"
    | "sideways-rl"
    | "sideways-lr";

  /**
   * Syntax: auto | <integer>
   * Status: standard
   */
  zIndex?: any;
}
export default MDNCSSProperties;

