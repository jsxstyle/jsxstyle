import { useState, useEffect } from 'react';
import type { IDisposable } from 'monaco-editor/esm/vs/editor/editor.api';

interface ErrorState {
  state: 'error';
  value: unknown;
}

interface PendingState {
  state: 'pending';
}

interface SuccessState {
  state: 'success';
  value: typeof import('monaco-editor/esm/vs/editor/editor.api');
}

export const useMonacoEditor = (): ErrorState | PendingState | SuccessState => {
  const [monacoEditorState, setMonacoEditorState] =
    useState<typeof import('monaco-editor/esm/vs/editor/editor.api')>();

  const [errorState, setErrorState] = useState<unknown>();

  useEffect(() => {
    // only fetch monaco-editor in a browser environment
    if (typeof window === 'undefined') return;

    const disposables: IDisposable[] = [];

    import(
      /* webpackChunkName: "monaco-editor" */ 'monaco-editor/esm/vs/editor/editor.api'
    )
      .then((monacoEditor) => {
        monacoEditor.languages.typescript.typescriptDefaults.setCompilerOptions(
          {
            target: monacoEditor.languages.typescript.ScriptTarget.ES2015,
            esModuleInterop: true,
            jsx: monacoEditor.languages.typescript.JsxEmit.ReactJSX,
            moduleResolution:
              monacoEditor.languages.typescript.ModuleResolutionKind.NodeJs,
            module: monacoEditor.languages.typescript.ModuleKind.CommonJS,
            noEmit: false,
            strict: true,
            lib: ['lib.es5.d.ts', 'lib.esnext.d.ts', 'lib.dom.d.ts'],
          }
        );

        Object.entries({
          // prettier-ignore
          jsxstyle: require.context('!!raw-loader!jsxstyle/lib/types/react/', true, /\.d\.ts$/),
          // prettier-ignore
          react: require.context('!!raw-loader!@types/react/', true, /\.d\.ts$/),
        }).forEach(([packageName, req]) => {
          req.keys().forEach((key) => {
            const content: string = req(key).default;
            const formattedKey = key.slice(2);
            const libName = `file:///node_modules/@types/${packageName}/${formattedKey}`;
            disposables.push(
              monacoEditor.languages.typescript.typescriptDefaults.addExtraLib(
                content,
                libName
              )
            );

            disposables.push(
              // Enable command-click to view lib source
              monacoEditor.editor.createModel(
                content,
                'typescript',
                monacoEditor.Uri.parse(libName)
              )
            );
          });
        });

        setMonacoEditorState(monacoEditor);
      })
      .catch((error) => {
        setErrorState(error);
      });

    return () => {
      disposables.forEach((obj) => obj.dispose());
    };
  }, []);

  if (errorState) {
    return {
      state: 'error',
      value: errorState,
    };
  }

  if (monacoEditorState) {
    return {
      state: 'success',
      value: monacoEditorState,
    };
  }

  return {
    state: 'pending',
  };
};
