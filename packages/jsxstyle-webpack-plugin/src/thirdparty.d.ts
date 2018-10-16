declare module 'webpack/lib/node/NodeWatchFileSystem' {
  class NodeWatchFileSystem {
    constructor(fs: import('webpack').InputFileSystem);
  }
  export = NodeWatchFileSystem;
}

declare module 'webpack/lib/MemoryOutputFileSystem' {
  import MemoryFS = require('memory-fs');
  export = MemoryFS;
}
