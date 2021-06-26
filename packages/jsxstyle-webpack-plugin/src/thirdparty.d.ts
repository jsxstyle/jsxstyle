declare module 'webpack/lib/node/NodeWatchFileSystem' {
  class NodeWatchFileSystem {
    constructor(fs: import('webpack').InputFileSystem);
  }
  export = NodeWatchFileSystem;
}
