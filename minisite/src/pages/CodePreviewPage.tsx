import * as jsxstyle from '@jsxstyle/react';
import * as React from 'react';
import * as jsxRuntime from 'react/jsx-runtime';

import { Block, Col, Row, css } from '@jsxstyle/react';
import { useEffect, useReducer, useRef } from 'react';
import { CodeModule } from '../components/CodeModule';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { useAsyncModule } from '../hooks/useAsyncModule';
import { styleConstants } from '../utilities/constants';

const modules = {
  react: React,
  'react/jsx-runtime': jsxRuntime,
  jsxstyle,
};

const requireFn = (moduleName: string) => {
  if (!modules.hasOwnProperty(moduleName)) {
    throw new Error('Unsupported module: ' + moduleName);
  }
  return modules[moduleName as keyof typeof modules];
};

const DefaultComponent: React.FC = () => null;

interface TranspileResult {
  component: React.FC;
  dispose?: (() => void) | null;
  js: string;
  css: string;
}

// using a reducer here to access previous state before setting new state (gross)
const reducer: React.Reducer<TranspileResult, TranspileResult> = (
  prevState,
  action
) => {
  try {
    prevState.dispose?.();
  } catch {
    //
  }
  return action;
};

const Button: React.FC<
  React.PropsWithChildren<JSX.IntrinsicElements['button']>
> = (props) => {
  return (
    <Block
      component="button"
      border="none"
      color={styleConstants.background}
      backgroundColor={styleConstants.foreground}
      padding="5px 10px"
      borderRadius={4}
      cursor="pointer"
      className={props.className}
      props={props}
    />
  );
};

export const CodePreviewPage: React.FC = () => {
  const transpileModule = useAsyncModule(
    () => import('../utilities/transpile')
  );

  const [transpileResult, setTranspileResult] = useReducer(reducer, {
    component: DefaultComponent,
    dispose: null,
    js: '',
    css: '',
  });

  const styleElementRef = useRef<HTMLStyleElement | null>(null);

  useEffect(() => {
    const element = document.createElement('style');
    styleElementRef.current = element;
    document.head.appendChild(element);

    return () => {
      document.head.removeChild(element);
      styleElementRef.current = null;
    };
  }, []);

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
        const { css: extractedCss, js, browserFriendlyJs } = transpile(code);

        if (styleElementRef.current) {
          styleElementRef.current.innerText = extractedCss;
        }

        const moduleExports: {
          default: React.ComponentType | null;
          dispose?: (() => void) | null;
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
              js,
              css: extractedCss,
              dispose,
              component: () => (
                <ErrorBoundary>
                  <ExportedComponent />
                </ErrorBoundary>
              ),
            });
          } else {
            setTranspileResult({
              js,
              css: '',
              component: () => (
                <Block>Your code is missing a default export.</Block>
              ),
            });
          }
        } catch (error) {
          setTranspileResult({
            js,
            css: '',
            component: () => (
              <Block>Could not evaluate your code: {error + ''}</Block>
            ),
          });
        }
      } catch (error) {
        console.error('Transpile error: %o', error);
        setTranspileResult({
          js: '',
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
  }, [transpileModule]);

  return (
    <Col gap={20} padding={20}>
      <Row
        border="1px solid"
        borderColor={styleConstants.border}
        padding={10}
        gap={5}
      >
        {styleConstants.variantNames.map((variantName) => {
          const variant = styleConstants.variants[variantName];
          return (
            <Button
              className={css({
                [`.${variant.className} &`]: { outline: '3px solid red' },
              })}
              key={variantName}
              onClick={variant.activate}
            >
              {variantName}
            </Button>
          );
        })}
        <Button onClick={() => styleConstants.setVariant(null)}>
          remove override
        </Button>
      </Row>
      <transpileResult.component />
      <CodeModule title="Extracted CSS" code={transpileResult.css} />
      <CodeModule title="Transformed JS" code={transpileResult.js} />
    </Col>
  );
};
