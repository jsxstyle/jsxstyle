declare module 'webpack/lib/node/NodeWatchFileSystem' {
  class NodeWatchFileSystem {
    constructor(fs: import('webpack').InputFileSystem);
  }
  export = NodeWatchFileSystem;
}

declare module 'webpack/lib/LibraryTemplatePlugin';
declare module 'webpack/lib/LoaderTargetPlugin';
declare module 'webpack/lib/node/NodeTargetPlugin';
declare module 'webpack/lib/node/NodeTemplatePlugin';
declare module 'webpack/lib/SingleEntryPlugin';
