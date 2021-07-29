declare module 'webpack/lib/node/NodeWatchFileSystem' {
  class NodeWatchFileSystem {
    constructor(fs: import('webpack').InputFileSystem);
  }
  export = NodeWatchFileSystem;
}

declare module 'webpack/lib/SingleEntryPlugin' {
  class SingleEntryPlugin {
    constructor(...args: any[]);
  }
  export = SingleEntryPlugin;
}

declare module 'webpack/lib/LibraryTemplatePlugin' {
  class LibraryTemplatePlugin {
    constructor(...args: any[]);
  }
  export = LibraryTemplatePlugin;
}

declare module 'webpack/lib/node/NodeTargetPlugin' {
  class NodeTargetPlugin {
    constructor(...args: any[]);
  }
  export = NodeTargetPlugin;
}
