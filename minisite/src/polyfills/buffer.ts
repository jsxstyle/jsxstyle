export const isBuffer = () => false;

export const from = (value: string) => {
  return {
    toString(encoding: string) {
      if (encoding === 'base64') return window.btoa(value);
      throw new Error('Unhandled encoding: ' + encoding);
    },
  };
};
