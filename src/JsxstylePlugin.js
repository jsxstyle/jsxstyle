'use strict';

var assign = require('object-assign');
var fs = require('fs');

class JsxstylePlugin {
  constructor() {
  }

  apply(compiler) {
    var writtenFiles = {};
    compiler.jsxstylePluginEnabled = true;

    compiler.resolvers.normal.plugin('file', function(request, callback) {
      var generatedCss = compiler.jsxstyle && compiler.jsxstyle[request.request];

      if (generatedCss && !writtenFiles[request.request]) {
        // TODO: This is so unbelievably bad, but I believe webpack's path
        // resolving is broken because it resolves loaders relative to the
        // resolved path of the file, not the request.
        fs.writeFile(request.request, generatedCss, err => {
          if (err) {
            return callback(err);
          }
          writtenFiles[request.request] = true;

          return callback();
        });
      } else {
        return callback();
      }
    });

    compiler.plugin('done', () => {
      for (let path in writtenFiles) {
        fs.unlinkSync(path);
      }
    });
  }
}

module.exports = JsxstylePlugin;
