type MemoryOutputFileSystem = import('webpack/lib/MemoryOutputFileSystem');
type InputFileSystem = import('webpack').InputFileSystem;

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
  memoryFS: MemoryOutputFileSystem
): InputFileSystem {
  return new Proxy(fs, {
    get: (target, key) => {
      const value = target[key];

      if (handledMethods.hasOwnProperty(key)) {
        return function(this: any, filePath: string, ...args: string[]) {
          if (filePath.endsWith('__jsxstyle.css')) {
            return memoryFS[key](filePath, ...args);
          }
          return value.call(this, filePath, ...args);
        };
      }

      return value;
    },
  });
}
