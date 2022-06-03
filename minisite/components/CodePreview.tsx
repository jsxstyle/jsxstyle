import { Block, CSSProperties } from 'jsxstyle';
import { useEffect, useRef, useState } from 'react';

interface CodePreviewProps {
  code: string;
  height?: CSSProperties['height'];
  width?: CSSProperties['width'];
  children?: never;
}

export const CodePreview: React.FC<CodePreviewProps> = ({
  code,
  width = '100%',
  height = '100%',
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [iframeReady, setIframeReady] = useState(false);

  useEffect(() => {
    const handleMessage = (event: WindowEventMap['message']) => {
      if (event.data === 'code preview ready!') {
        setIframeReady(true);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  useEffect(() => {
    iframeRef.current?.contentWindow?.postMessage(code);
  }, [iframeReady, code, iframeRef.current]);

  return (
    <Block
      component="iframe"
      flex="1 1 auto"
      border="none"
      width={width}
      height={height}
      props={{ ref: iframeRef, src: '/code-preview' }}
    ></Block>
  );
};
