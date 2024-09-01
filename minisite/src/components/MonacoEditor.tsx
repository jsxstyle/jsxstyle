import { useMatchMedia } from 'jsxstyle';
import type * as monaco from 'monaco-editor';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import typescriptWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';
import { useEffect, useRef } from 'react';
import { useAsyncModule } from '../hooks/useAsyncModule';

export type MonacoEditorChangeHandler = (
  value: string,
  event: monaco.editor.IModelContentChangedEvent
) => void;

export interface MonacoEditorProps {
  className?: string;
  onChange?: MonacoEditorChangeHandler;
  options?: monaco.editor.IStandaloneEditorConstructionOptions;
  value: string;
}

window.MonacoEnvironment = {
  async getWorker(_workerId, label) {
    switch (label) {
      case 'typescript': {
        return new typescriptWorker();
      }
      case 'json': {
        return new jsonWorker();
      }
      default: {
        return new editorWorker();
      }
    }
  },
};

const getCustomMonaco = () => import('./customMonaco');

export const MonacoEditor: React.FC<MonacoEditorProps> = ({
  className,
  onChange,
  options = {},
  value,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor>();
  const isDarkMode = useMatchMedia('screen and (prefers-color-scheme: dark)');
  const monacoImport = useAsyncModule(getCustomMonaco);

  const theme = isDarkMode ? 'vs-dark' : 'vs';
  useEffect(() => {
    editorRef.current?.updateOptions({ theme });
  }, [theme]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: this is only for initial setup
  useEffect(() => {
    if (monacoImport.state !== 'success' || !containerRef.current) return;

    const monaco = monacoImport.result.monaco;

    const editor = monaco.editor.create(containerRef.current, {
      scrollBeyondLastLine: true,
      minimap: {
        enabled: true,
      },
      ...options,
      language: 'typescript',
      theme,
      wordWrap: 'on',
      wrappingIndent: 'deepIndent',
    });
    editorRef.current = editor;

    const onChangeModelContentSubscription = editor.onDidChangeModelContent(
      (event) => {
        const value = editor.getValue() || '';
        onChange?.(value, event);
      }
    );

    const model = monaco.editor.createModel(
      value,
      'typescript',
      monaco.Uri.file('exampleSchema.tsx')
    );
    editor.setModel(model);

    const resizeObserver = new ResizeObserver((entries) => {
      const containerElement = entries.find(
        (entry) => entry.target === containerRef.current
      );
      if (containerElement) {
        editor.layout();
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      editor.dispose();
      model.dispose();
      onChangeModelContentSubscription.dispose();
      resizeObserver.disconnect();
    };
  }, [monacoImport.state]);

  return <div className={className} ref={containerRef} />;
};
