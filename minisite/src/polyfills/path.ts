const extnameRegex = /(\.[a-z]+)$/i;

export const resolve = (path: string) => path;
export const isAbsolute = (path: string) => path.trim().startsWith('/');
export const dirname = (path: string) => path.split('/').slice(0, -1).join('/');
export const extname = (path: string) => extnameRegex.exec(path)?.[1] || '';
export const join = (...paths: string[]) => paths.join('/');
export const basename = (path: string) => path.split('/').pop() || path;
export const relative = (...paths: string[]) => paths.pop();
