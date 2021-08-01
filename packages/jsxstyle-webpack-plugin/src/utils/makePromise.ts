interface PromiseObj<T> {
  resolve: (value: T) => void;
  reject: (reason?: any) => void;
  promise: Promise<T>;
}

export const makePromise = <T extends any>(): PromiseObj<T> => {
  const result: PromiseObj<T> = {} as any;

  result.promise = new Promise<T>((resolve, reject) => {
    result.resolve = resolve;
    result.reject = reject;
  });

  return result;
};
