import { useRef, useEffect } from 'react';
import { useMonacoEditor } from '../hooks/useMonacoEditor';
import type EditorApi from 'monaco-editor/esm/vs/editor/editor.api';
import { Block, type CSSProperties } from 'jsxstyle';
import debounce from 'lodash/debounce';

export type ChangeHandler = (
  value: string,
  event: EditorApi.editor.IModelContentChangedEvent
) => void;

export interface MonacoEditorProps extends CSSProperties {
  className?: string;
  onChange?: ChangeHandler;
  options?: EditorApi.editor.IStandaloneEditorConstructionOptions;
  theme?: string;
  value: string;
}

export const MonacoEditor: React.FC<MonacoEditorProps> = ({
  className,
  onChange,
  options = {},
  theme = 'vs-dark',
  value,
  ...cssProperties
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const monacoEditorObj = useMonacoEditor();
  const editorRef = useRef<EditorApi.editor.IStandaloneCodeEditor>();

  useEffect(() => {
    editorRef.current?.updateOptions({ theme });
  }, [theme]);

  useEffect(() => {
    if (monacoEditorObj.state !== 'success') return;

    const monacoEditor = monacoEditorObj.value;

    if (!containerRef.current) {
      throw new Error('Missing containerRef');
    }

    const model = monacoEditor.editor.createModel(
      value,
      'typescript',
      monacoEditor.Uri.file('example.tsx')
    );

    const editor = monacoEditor.editor.create(containerRef.current, {
      ...options,
      extraEditorClassName: className,
      language: 'typescript',
      scrollBeyondLastLine: false,
      minimap: {
        enabled: false,
      },
      model,
      theme,
    });

    editorRef.current = editor;

    const resizeHandler = debounce(() => {
      editor.layout();
    }, 200);

    window.addEventListener('resize', resizeHandler);

    const onChangeModelContentSubscription = editor.onDidChangeModelContent(
      (event) => {
        const value = editor.getValue() || '';
        onChange?.(value, event);
      }
    );

    return () => {
      editor.dispose();
      model.dispose();
      onChangeModelContentSubscription.dispose();
      window.removeEventListener('resize', resizeHandler);
    };
  }, [monacoEditorObj.state]);

  return (
    <Block
      {...cssProperties}
      overflow="hidden"
      props={{ ref: containerRef }}
    ></Block>
  );
};
