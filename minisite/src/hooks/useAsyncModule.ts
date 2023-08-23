import { useEffect, useState } from 'react';

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
  getter: () => Promise<T>
): ErrorState | PendingState | SuccessState<T> => {
  const [error, setError] = useState<unknown>();
  const [result, setResult] = useState<T>();

  useEffect(() => {
    getter()
      .then((result) => setResult(result))
      .catch((error) => setError(error));
  }, []);

  if (error) {
    console.error('useAsyncModule error:', error);
    return { state: 'error', error };
  }

  if (result) {
    return { state: 'success', result };
  }

  return { state: 'pending' };
};
