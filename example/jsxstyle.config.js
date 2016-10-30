var generateSha = require('git-sha1');

module.exports = {
  getStylesheetId: (id) => generateSha(id.toString()).substring(0, 6),
  formatClassNameFromStylesheet: (stylesheet) => {
    return `${stylesheet.displayName}-${stylesheet.style.name || ''}__${stylesheet.id}`
  }
};
