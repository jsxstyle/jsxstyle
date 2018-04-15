const handledMethods = {
  // exists: true,
  // existsSync: true,
  mkdir: true,
  mkdirSync: true,
  mkdirp: true,
  mkdirpSync: true,
  readdir: true,
  readdirSync: true,
  readFile: true,
  readFileSync: true,
  // readlink: true,
  // readlinkSync: true,
  rmdir: true,
  rmdirSync: true,
  stat: true,
  statSync: true,
  unlink: true,
  unlinkSync: true,
  writeFile: true,
  writeFileSync: true,
};

export default function wrapFileSystem(fs: any, memoryFS: any): any {
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
