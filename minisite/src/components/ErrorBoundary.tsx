import { Block } from 'jsxstyle';
import * as React from 'react';

interface ErrorBoundaryProps {
  children?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state = { hasError: false };

  static getDerivedStateFromError(error: unknown) {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, errorInfo: unknown) {
    console.log(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <Block>Something went wrong.</Block>;
    }
    return this.props.children;
  }
}
