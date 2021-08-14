import { CSSProperties, CommonComponentProp } from 'jsxstyle-utils';

export type IntrinsicElement = keyof JSX.IntrinsicElements;

export type ValidComponentPropValue =
  | false
  | null
  | undefined
  | IntrinsicElement
  | React.FunctionComponent<any>
  | React.ComponentClass<any>;

/**
 * Generic that returns either the extracted props type for a React component
 * or the props type for an IntrinsicElement.
 */
// shout out to https://git.io/fxMvl
// modified to add detection for empty interfaces
export type ExtractProps<T extends ValidComponentPropValue> = T extends
  | false
  | null
  | undefined
  ? JSX.IntrinsicElements['div']
  : T extends IntrinsicElement
  ? JSX.IntrinsicElements[T]
  : T extends React.FunctionComponent<infer FCProps>
  ? keyof FCProps extends never
    ? {}
    : FCProps
  : T extends React.ComponentClass<infer ClassProps>
  ? keyof ClassProps extends never
    ? {}
    : ClassProps
  : {};

/** Props that will be passed through to whatever component is specified */
export type StylableComponentProps<T extends ValidComponentPropValue> = Pick<
  ExtractProps<T>,
  Extract<keyof ExtractProps<T>, CommonComponentProp | KnownEventHandler>
>;

/** Props for jsxstyle components that have a `component` prop set */
interface JsxstylePropsWithComponent<C extends ValidComponentPropValue> {
  /** Component value can be either a React component or a tag name string. Defaults to `div`. */
  component: C;
  /** Object of props that will be passed down to the component specified in the `component` prop */
  props?: ExtractProps<C>;
}

/** Props for jsxstyle components that have no `component` prop set */
interface JsxstyleDefaultProps {
  /** Component value can be either a React component or a tag name string. Defaults to `div`. */
  component?: undefined;
  /** Object of props that will be passed down to the underlying div */
  props?: JSX.IntrinsicElements['div'];
}

export type JsxstyleProps<T extends ValidComponentPropValue = 'div'> = (
  | JsxstyleDefaultProps
  | JsxstylePropsWithComponent<T>
) &
  StylableComponentProps<T> &
  CSSProperties;

// copied from React.DOMAttributes
// I'm not using React.DOMAttributes here because it's an interface that gets augmented
type KnownEventHandler =
  // Clipboard Events
  | 'onCopy'
  | 'onCopyCapture'
  | 'onCut'
  | 'onCutCapture'
  | 'onPaste'
  | 'onPasteCapture'

  // Composition Events
  | 'onCompositionEnd'
  | 'onCompositionEndCapture'
  | 'onCompositionStart'
  | 'onCompositionStartCapture'
  | 'onCompositionUpdate'
  | 'onCompositionUpdateCapture'

  // Focus Events
  | 'onFocus'
  | 'onFocusCapture'
  | 'onBlur'
  | 'onBlurCapture'

  // Form Events
  | 'onChange'
  | 'onChangeCapture'
  | 'onBeforeInput'
  | 'onBeforeInputCapture'
  | 'onInput'
  | 'onInputCapture'
  | 'onReset'
  | 'onResetCapture'
  | 'onSubmit'
  | 'onSubmitCapture'
  | 'onInvalid'
  | 'onInvalidCapture'

  // Image Events
  | 'onLoad'
  | 'onLoadCapture'
  | 'onError'
  | 'onErrorCapture'

  // Keyboard Events
  | 'onKeyDown'
  | 'onKeyDownCapture'
  | 'onKeyPress'
  | 'onKeyPressCapture'
  | 'onKeyUp'
  | 'onKeyUpCapture'

  // Media Events
  | 'onAbort'
  | 'onAbortCapture'
  | 'onCanPlay'
  | 'onCanPlayCapture'
  | 'onCanPlayThrough'
  | 'onCanPlayThroughCapture'
  | 'onDurationChange'
  | 'onDurationChangeCapture'
  | 'onEmptied'
  | 'onEmptiedCapture'
  | 'onEncrypted'
  | 'onEncryptedCapture'
  | 'onEnded'
  | 'onEndedCapture'
  | 'onLoadedData'
  | 'onLoadedDataCapture'
  | 'onLoadedMetadata'
  | 'onLoadedMetadataCapture'
  | 'onLoadStart'
  | 'onLoadStartCapture'
  | 'onPause'
  | 'onPauseCapture'
  | 'onPlay'
  | 'onPlayCapture'
  | 'onPlaying'
  | 'onPlayingCapture'
  | 'onProgress'
  | 'onProgressCapture'
  | 'onRateChange'
  | 'onRateChangeCapture'
  | 'onSeeked'
  | 'onSeekedCapture'
  | 'onSeeking'
  | 'onSeekingCapture'
  | 'onStalled'
  | 'onStalledCapture'
  | 'onSuspend'
  | 'onSuspendCapture'
  | 'onTimeUpdate'
  | 'onTimeUpdateCapture'
  | 'onVolumeChange'
  | 'onVolumeChangeCapture'
  | 'onWaiting'
  | 'onWaitingCapture'

  // MouseEvents
  | 'onAuxClick'
  | 'onAuxClickCapture'
  | 'onClick'
  | 'onClickCapture'
  | 'onContextMenu'
  | 'onContextMenuCapture'
  | 'onDoubleClick'
  | 'onDoubleClickCapture'
  | 'onDrag'
  | 'onDragCapture'
  | 'onDragEnd'
  | 'onDragEndCapture'
  | 'onDragEnter'
  | 'onDragEnterCapture'
  | 'onDragExit'
  | 'onDragExitCapture'
  | 'onDragLeave'
  | 'onDragLeaveCapture'
  | 'onDragOver'
  | 'onDragOverCapture'
  | 'onDragStart'
  | 'onDragStartCapture'
  | 'onDrop'
  | 'onDropCapture'
  | 'onMouseDown'
  | 'onMouseDownCapture'
  | 'onMouseEnter'
  | 'onMouseLeave'
  | 'onMouseMove'
  | 'onMouseMoveCapture'
  | 'onMouseOut'
  | 'onMouseOutCapture'
  | 'onMouseOver'
  | 'onMouseOverCapture'
  | 'onMouseUp'
  | 'onMouseUpCapture'

  // Selection Events
  | 'onSelect'
  | 'onSelectCapture'

  // Touch Events
  | 'onTouchCancel'
  | 'onTouchCancelCapture'
  | 'onTouchEnd'
  | 'onTouchEndCapture'
  | 'onTouchMove'
  | 'onTouchMoveCapture'
  | 'onTouchStart'
  | 'onTouchStartCapture'

  // Pointer Events
  | 'onPointerDown'
  | 'onPointerDownCapture'
  | 'onPointerMove'
  | 'onPointerMoveCapture'
  | 'onPointerUp'
  | 'onPointerUpCapture'
  | 'onPointerCancel'
  | 'onPointerCancelCapture'
  | 'onPointerEnter'
  | 'onPointerEnterCapture'
  | 'onPointerLeave'
  | 'onPointerLeaveCapture'
  | 'onPointerOver'
  | 'onPointerOverCapture'
  | 'onPointerOut'
  | 'onPointerOutCapture'
  | 'onGotPointerCapture'
  | 'onGotPointerCaptureCapture'
  | 'onLostPointerCapture'
  | 'onLostPointerCaptureCapture'

  // UI Events
  | 'onScroll'
  | 'onScrollCapture'

  // Wheel Events
  | 'onWheel'
  | 'onWheelCapture'

  // Animation Events
  | 'onAnimationStart'
  | 'onAnimationStartCapture'
  | 'onAnimationEnd'
  | 'onAnimationEndCapture'
  | 'onAnimationIteration'
  | 'onAnimationIterationCapture'

  // Transition Events
  | 'onTransitionEnd'
  | 'onTransitionEndCapture';
