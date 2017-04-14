// Copied from mock-fs: https://git.io/vSQ2G
// via https://github.com/sysgears/webpack-virtual-modules

'use strict';

const constants = require('constants');

/**
 * Create a new stats object.
 * @param {Object} config Stats properties.
 * @constructor
 */
function Stats(config) {
  for (const key in config) {
    this[key] = config[key];
  }
}

/**
 * Check if mode indicates property.
 * @param {number} property Property to check.
 * @return {boolean} Property matches mode.
 */
Stats.prototype._checkModeProperty = function(property) {
  return (this.mode & constants.S_IFMT) === property;
};

/**
 * @return {Boolean} Is a directory.
 */
Stats.prototype.isDirectory = function() {
  return this._checkModeProperty(constants.S_IFDIR);
};

/**
 * @return {Boolean} Is a regular file.
 */
Stats.prototype.isFile = function() {
  return this._checkModeProperty(constants.S_IFREG);
};

/**
 * @return {Boolean} Is a block device.
 */
Stats.prototype.isBlockDevice = function() {
  return this._checkModeProperty(constants.S_IFBLK);
};

/**
 * @return {Boolean} Is a character device.
 */
Stats.prototype.isCharacterDevice = function() {
  return this._checkModeProperty(constants.S_IFCHR);
};

/**
 * @return {Boolean} Is a symbolic link.
 */
Stats.prototype.isSymbolicLink = function() {
  return this._checkModeProperty(constants.S_IFLNK);
};

/**
 * @return {Boolean} Is a named pipe.
 */
Stats.prototype.isFIFO = function() {
  return this._checkModeProperty(constants.S_IFIFO);
};

/**
 * @return {Boolean} Is a socket.
 */
Stats.prototype.isSocket = function() {
  return this._checkModeProperty(constants.S_IFSOCK);
};

module.exports = Stats;
