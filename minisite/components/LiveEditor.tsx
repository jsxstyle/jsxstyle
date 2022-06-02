import * as React from 'react';
import * as jsxstyle from 'jsxstyle';
import * as jsxRuntime from 'react/jsx-runtime';

import { useCallback } from 'react';
import { Col, Row, Block } from 'jsxstyle';
import { MonacoEditor } from './MonacoEditor';
import { useAsyncModule } from '../hooks/useAsyncModule';
import { ErrorBoundary } from './ErrorBoundary';
import { CodeModule } from './CodeModule';

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

const defaultComponent = (
  <Block>Default-export something that React can render</Block>
);

export const LiveEditor: React.FC = () => {
  const transpileModule = useAsyncModule(
    () => import('../utilities/transpile')
  );

  const [element, setElement] =
    React.useState<React.ReactNode>(defaultComponent);

  const handleChange = useCallback(
    (code: string) => {
      if (transpileModule.state !== 'success') return;

      const { transpile } = transpileModule.result;

      try {
        const { js, css, cssFileName, browserFriendlyJs } = transpile(code);

        const moduleExports = { default: defaultComponent };
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
        } catch (error) {
          moduleExports.default = (
            <Block>Error evaluating your code: {error + ''}</Block>
          );
        }

        const element = moduleExports.default;
        setElement(
          <Col gap={15} padding={20}>
            <Block>
              <ErrorBoundary>{element}</ErrorBoundary>
            </Block>

            <CodeModule title="Processed JS" code={js} />
            <CodeModule title={'Extracted CSS: ' + cssFileName} code={css} />
            <CodeModule title="Transpiled JS" code={browserFriendlyJs} />
          </Col>
        );
      } catch (error) {
        setElement(<Block>Something really went wrong: {error + ''}</Block>);
      }
    },
    [transpileModule.state === 'success']
  );

  return (
    <Row height="100vh" alignItems="stretch">
      <MonacoEditor
        flex="1 1 300px"
        theme="vs-dark"
        value={`import { Block, useMatchMedia } from 'jsxstyle';

function ExampleComponent() {
  const isDarkMode = useMatchMedia('screen and (prefers-color-scheme: dark)');
  return (
    <Block
      color={isDarkMode ? 'white' : 'black'}
      backgroundColor={isDarkMode ? 'black' : 'white'}
    >
      Dark mode is{isDarkMode ? '' : ' not'} active {isDarkMode ? '🌃' : '🌅'}
    </Block>
  );
}

export default <ExampleComponent />;
`}
        onChange={handleChange}
      />

      <Block flex="1 1 300px" backgroundColor="#EEE" overflowX="scroll">
        {element}
      </Block>
    </Row>
  );
};
