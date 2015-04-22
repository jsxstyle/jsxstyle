'use strict';

var recast = require('recast');
var n = recast.types.namedTypes;

function renameClass(renames, src) {
  var ast = recast.parse(src);

  recast.visit(ast, {
    visitJSXOpeningElement: function(path) {
      if (path.node.name.name[0] === path.node.name.name[0].toLowerCase()) {
        path.node.attributes.forEach(function(attribute) {
          var name = attribute.name.name;
          if (
            name === 'className' &&
              n.Literal.check(attribute.value) &&
              typeof attribute.value.value === 'string'
          ) {
            attribute.value.value = attribute.value.value.split(' ').map(function(className) {
              return renames[className] || className;
            }).join(' ');
          }
        });
      }
      this.traverse(path);
    }
  });

  return recast.print(ast).code;
}

module.exports = renameClass;
