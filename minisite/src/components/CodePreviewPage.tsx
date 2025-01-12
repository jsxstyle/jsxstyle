import * as jsxstyle from '@jsxstyle/react';
import * as React from 'react';
import * as jsxRuntime from 'react/jsx-runtime';

import type { BuiltCustomProperties, CustomPropsObject } from '@jsxstyle/core';
import { Block, Col, Row, css } from '@jsxstyle/react';
import { useEffect, useReducer } from 'react';
import { styleConstants } from '../utilities/constants';
import { useAsyncModule } from '../utilities/useAsyncModule';
import { CodeModule } from './CodeModule';
import { ErrorBoundary } from './ErrorBoundary';
import { initialSampleCode } from './initialSampleCode';

const modules = {
  react: React,
  'react/jsx-runtime': jsxRuntime,
  '@jsxstyle/react': jsxstyle,
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
  customProperties?: BuiltCustomProperties<string, CustomPropsObject> | null;
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
      // color and backgroundColor are unset so we can show native control colors changing with color-scheme
      component="button"
      border="none"
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
    customProperties: null,
    js: '',
    css: '',
  });

  const setVariant = (variantName: string | null): void => {
    const overrideElement = document.documentElement;
    if (!transpileResult.customProperties) return;
    const variants = transpileResult.customProperties.variants;
    const variantNames = transpileResult.customProperties.variantNames;
    overrideElement.classList.remove(
      ...variantNames.map(
        // biome-ignore lint/style/noNonNullAssertion:
        (key) => variants[key]!.className
      )
    );
    if (variantName) {
      overrideElement.classList.add(
        // biome-ignore lint/style/noNonNullAssertion:
        variants[variantName]!.className
      );
    }
  };

  useEffect(() => {
    if (transpileModule.state === 'pending') return;
    if (transpileModule.state === 'error') {
      console.error('Error transpiling module: %o', transpileModule.error);
      return;
    }
    const { transpile } = transpileModule.result;

    const handleMessage = (code: unknown) => {
      if (typeof code !== 'string') return;

      try {
        const { css, js, browserFriendlyJs } = transpile(code);

        const moduleExports: {
          default: React.ComponentType | null;
          dispose: (() => void) | null;
          customProperties: BuiltCustomProperties<
            string,
            CustomPropsObject
          > | null;
        } = {
          default: null,
          dispose: null,
          customProperties: null,
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
          const exportedCustomProperties = moduleExports.customProperties;

          const dispose = moduleExports.dispose;
          if (ExportedComponent) {
            setTranspileResult({
              js,
              css,
              dispose,
              customProperties: exportedCustomProperties,
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
              customProperties: null,
              component: () => (
                <Block>Your code is missing a default export.</Block>
              ),
            });
          }
        } catch (error) {
          setTranspileResult({
            js,
            css: '',
            customProperties: null,
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

    handleMessage(initialSampleCode);
    window.parent.postMessage('code preview ready!');

    const storageHandler = (event: StorageEvent) => {
      if (event.key === 'code') {
        handleMessage(event.newValue);
      }
    };

    window.addEventListener('storage', storageHandler);
    return () => {
      window.removeEventListener('storage', storageHandler);
    };
  }, [transpileModule]);

  return (
    <Col gap={20} padding={20}>
      <Row
        border="1px solid"
        borderColor={styleConstants.color.border}
        padding={10}
        gap={5}
      >
        {transpileResult.customProperties?.variantNames.map((variantName) => {
          const variant =
            transpileResult.customProperties?.variants[variantName];
          if (!variant) return null;
          return (
            <Button
              className={css({
                [`.${variant.className} &`]: { outline: '3px solid red' },
              })}
              key={variantName}
              onClick={() => setVariant(variantName)}
            >
              {variantName}
            </Button>
          );
        })}
        <Button onClick={() => setVariant(null)}>remove override</Button>
      </Row>
      <style>{transpileResult.css}</style>
      <transpileResult.component />
      <CodeModule title="Extracted CSS" code={transpileResult.css} />
      <CodeModule title="Transformed JS" code={transpileResult.js} />
    </Col>
  );
};
