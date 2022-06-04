import * as React from 'react';
import * as jsxstyle from 'jsxstyle';
import * as jsxRuntime from 'react/jsx-runtime';

import { useEffect, useState } from 'react';
import { Col, Block } from 'jsxstyle';
import { useAsyncModule } from '../hooks/useAsyncModule';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { CodeModule } from '../components/CodeModule';

const modules = {
  react: React,
  'react/jsx-runtime': jsxRuntime,
  jsxstyle,
};

const requireFn = (moduleName: string) => {
  // eslint-disable-next-line no-prototype-builtins
  if (!modules.hasOwnProperty(moduleName)) {
    throw new Error('Unsupported module: ' + moduleName);
  }
  return modules[moduleName];
};

const DefaultComponent: React.FC = () => (
  <Block padding={20}>Type out some React code in the editor</Block>
);

const CodePreviewPage: React.FC = () => {
  const transpileModule = useAsyncModule(
    () => import('../utilities/transpile')
  );

  const [transpiledCode, setTranspiledCode] = useState<{
    component: React.FC;
    css: string;
  }>({
    component: DefaultComponent,
    css: '',
  });

  useEffect(() => {
    if (transpileModule.state !== 'success') return;
    const { transpile } = transpileModule.result;

    const handleMessage = (event: WindowEventMap['message']) => {
      const code = event.data as unknown;
      if (typeof code !== 'string') return;

      try {
        const {
          // js,
          css,
          // cssFileName,
          browserFriendlyJs,
        } = transpile(code);
        const moduleExports: { default: JSX.Element | null } = {
          default: null,
        };
        try {
          new Function(
            'exports',
            'require',
            'module',
            '__filename',
            '__dirname',
            browserFriendlyJs
          )(
            moduleExports,
            requireFn,
            { exports: moduleExports },
            '/example.tsx',
            '/'
          );

          const element = moduleExports.default;
          if (element) {
            setTranspiledCode({
              css,
              component: () => <ErrorBoundary>{element}</ErrorBoundary>,
            });
          } else {
            setTranspiledCode({
              css: '',
              component: () => (
                <Block>Your code is missing a default export.</Block>
              ),
            });
          }
        } catch (error) {
          setTranspiledCode({
            css: '',
            component: () => (
              <Block>Could not evaluate your code: {error + ''}</Block>
            ),
          });
        }
      } catch (error) {
        setTranspiledCode({
          css: '',
          component: () => (
            <Block>Something really went wrong: {error + ''}</Block>
          ),
        });
      }
    };

    window.addEventListener('message', handleMessage);
    window.parent.postMessage('code preview ready!');

    return () => window.removeEventListener('message', handleMessage);
  }, [transpileModule.state === 'success']);

  return (
    <Col gap={20} padding={20}>
      <transpiledCode.component />
      <CodeModule title="Extracted CSS" code={transpiledCode.css} />
      <style jsx global>
        {`
          ${transpiledCode.css}
        `}
      </style>
      <style jsx global>{`
        html,
        body {
          font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto,
            Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue,
            sans-serif;
          font-size: 16px;
          line-height: 1.2;
        }

        @media screen and (prefers-color-scheme: dark) {
          html,
          body {
            background-color: #333;
          }
        }

        * {
          box-sizing: border-box;
          padding: 0;
          margin: 0;
          font-size: inherit;
          line-height: inherit;
        }
      `}</style>
    </Col>
  );
};

export default CodePreviewPage;
