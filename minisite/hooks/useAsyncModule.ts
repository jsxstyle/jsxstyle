import { useEffect, useState } from 'react';

interface UseAsyncModuleOptions {
  ssr?: boolean;
}

interface ErrorState {
  state: 'error';
  error: unknown;
}

interface SuccessState<T> {
  state: 'success';
  result: T;
}

interface PendingState {
  state: 'pending';
}

export const useAsyncModule = <T>(
  getter: () => Promise<T>,
  options: UseAsyncModuleOptions = {}
): ErrorState | PendingState | SuccessState<T> => {
  const [error, setError] = useState<unknown>();
  const [result, setResult] = useState<T>();

  useEffect(() => {
    if (options.ssr !== false || typeof window !== 'undefined') {
      getter()
        .then((result) => setResult(result))
        .catch((error) => setError(error));
    }
  }, [options.ssr]);

  if (error) {
    return { state: 'error', error };
  }

  if (result) {
    return { state: 'success', result };
  }

  return { state: 'pending' };
};
