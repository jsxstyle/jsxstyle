import type { MemoryFS } from '../types';

type InputFileSystem = import('webpack').Compilation['inputFileSystem'];

const handledMethods = {
  // exists: true,
  // existsSync: true,
  // readlink: true,
  // readlinkSync: true,
  mkdir: true,
  mkdirp: true,
  mkdirpSync: true,
  mkdirSync: true,
  readdir: true,
  readdirSync: true,
  readFile: true,
  readFileSync: true,
  rmdir: true,
  rmdirSync: true,
  stat: true,
  statSync: true,
  unlink: true,
  unlinkSync: true,
  writeFile: true,
  writeFileSync: true,
};

export function wrapFileSystem(
  fs: InputFileSystem,
  memoryFS: MemoryFS
): InputFileSystem {
  return new Proxy(fs, {
    get: (target, prop, receiver) => {
      const value = Reflect.get(target, prop, receiver);

      if ((prop in handledMethods) as any as keyof MemoryFS) {
        return function (this: any, filePath: string, ...args: string[]) {
          if (filePath.endsWith('__jsxstyle.css')) {
            // @ts-expect-error too complex for typescript
            return memoryFS[prop](filePath, ...args);
          }
          return value.call(this, filePath, ...args);
        };
      }

      return value;
    },
  });
}
