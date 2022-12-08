import * as React from 'react';
import * as jsxstyle from 'jsxstyle';
import * as jsxRuntime from 'react/jsx-runtime';

import { useEffect, useReducer } from 'react';
import { Row, Col, Block } from 'jsxstyle';
import { useAsyncModule } from '../hooks/useAsyncModule';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { CodeModule } from '../components/CodeModule';
import { styleConstants } from '../utilities/constants';

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
  return modules[moduleName as keyof typeof modules];
};

const DefaultComponent: React.FC = () => null;

interface TranspileResult {
  component: React.FC;
  dispose?: (() => {}) | null;
  css: string;
}

// using a reducer here to access previous state before setting new state (gross)
const reducer: React.Reducer<TranspileResult, TranspileResult> = (
  prevState,
  action
) => {
  try {
    prevState.dispose?.();
  } catch {}
  return action;
};

const CodePreviewPage: React.FC = () => {
  const transpileModule = useAsyncModule(
    () => import('../utilities/transpile')
  );

  const [transpileResult, setTranspileResult] = useReducer(reducer, {
    component: DefaultComponent,
    dispose: null,
    css: '',
  });

  useEffect(() => {
    if (transpileModule.state === 'pending') return;
    if (transpileModule.state === 'error') {
      console.error('Error transpiling module: %o', transpileModule.error);
      return;
    }
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
        const moduleExports: {
          default: React.ComponentType | null;
          dispose?: (() => {}) | null;
        } = {
          default: null,
          dispose: null,
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

          const ExportedComponent = moduleExports.default;
          const dispose = moduleExports.dispose;
          if (ExportedComponent) {
            setTranspileResult({
              css,
              dispose,
              component: () => (
                <ErrorBoundary>
                  <ExportedComponent />
                </ErrorBoundary>
              ),
            });
          } else {
            setTranspileResult({
              css: '',
              component: () => (
                <Block>Your code is missing a default export.</Block>
              ),
            });
          }
        } catch (error) {
          setTranspileResult({
            css: '',
            component: () => (
              <Block>Could not evaluate your code: {error + ''}</Block>
            ),
          });
        }
      } catch (error) {
        console.error('Transpile error: %o', error);
        setTranspileResult({
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
      <Row
        border="1px solid"
        borderColor={styleConstants.border}
        padding={3}
        gap={3}
      >
        {styleConstants.variants.map((variantName) => (
          <button
            key={variantName}
            onClick={() => styleConstants.setVariant(variantName)}
          >
            {variantName}
          </button>
        ))}
        <button onClick={() => styleConstants.setVariant(null)}>
          remove override
        </button>
      </Row>
      <transpileResult.component />
      <CodeModule title="Extracted CSS" code={transpileResult.css} />
      <style jsx global>
        {`
          ${transpileResult.css}
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
          background-color: var(--jsxstyle-pageBackground);
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
