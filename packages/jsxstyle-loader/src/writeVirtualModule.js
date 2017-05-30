'use strict';

const path = require('path');
const VirtualStats = require('./VirtualStats');
const invariant = require('invariant');

let inode = 69000000;

// writeVirtualModule expects to be bound to the loader instance
function writeVirtualModule(filePath, contents) {
  invariant(
    this._compiler,
    'writeVirtualModule must be bound to the webpack loader instance'
  );

  if (!this.fs._writeVirtualFile) {
    // Write the contents of a file to the module cache and give it fake stats
    this.fs._writeVirtualFile = function(file, stats, contents) {
      this._virtualFiles = this._virtualFiles || {};
      this._virtualFiles[file] = { stats, contents };
      this._statStorage.data[file] = [null, stats];
      this._readFileStorage.data[file] = [null, contents];
    };

    // Modify purge method to purge virtual files as well as non-virtual files
    const originalPurge = this.fs.purge;
    this.fs.purge = function() {
      originalPurge.call(this, arguments);
      Object.keys(this._virtualFiles).forEach(file => {
        const data = this._virtualFiles[file];
        this._statStorage.data[file] = [null, data.stats];
        this._readFileStorage.data[file] = [null, data.contents];
      });
    };
  }

  const len = contents ? contents.length : 0;
  const time = Date.now();

  // https://nodejs.org/api/fs.html#fs_class_fs_stats
  const stats = new VirtualStats({
    dev: 8675309,
    nlink: 0,
    uid: 1000,
    gid: 1000,
    rdev: 0,
    blksize: 4096,
    ino: inode++,
    mode: 33188,
    size: len,
    blocks: Math.floor(len / 4096),
    atime: time,
    mtime: time,
    ctime: time,
    birthtime: time,
  });

  const modulePath = path.isAbsolute(filePath)
    ? filePath
    : path.join(this.context, filePath);

  this.fs._writeVirtualFile(modulePath, stats, contents);
}

module.exports = writeVirtualModule;
