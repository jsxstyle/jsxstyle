import * as React from 'react';
import { Block } from 'jsxstyle';

interface ErrorBoundaryProps {
  children?: React.ReactNode;
}

interface ErrorBoundaryState {
  error: unknown;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state = { error: null };

  static getDerivedStateFromError(error: unknown) {
    console.error(error);
    return { error };
  }

  render() {
    if (this.state.error) {
      return <Block>{this.state.error + ''}</Block>;
    }
    return this.props.children;
  }
}
