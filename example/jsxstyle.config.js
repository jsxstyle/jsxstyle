var generateSha = require('git-sha1');

module.exports = {
  getStylesheetId: (id) => generateSha(id.toString()).substring(0, 6),
  formatClassNameFromStylesheet: (ss) => `${ss.name}_${ss.style.name || ''}_${ss.id}`
};
