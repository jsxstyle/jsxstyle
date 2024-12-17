// in this polyfill, contexts are just normal objects
type PolyfillVMContext = Record<string, unknown>;

export const createContext = (obj: PolyfillVMContext) => obj;

export const runInContext = (code: string, context: PolyfillVMContext) => {
  return new Function(...Object.keys(context), code)(...Object.values(context));
};

export const runInNewContext = (code: string) => new Function(code)();

export const runInThisContext = (code: string) => new Function(code)();
