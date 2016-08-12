'use strict';

var CSSDisplayNames = require('./CSSDisplayNames');
var explodePseudoStyles = require('./explodePseudoStyles');
var createCSS = require('./createCSS');

var assign = require('object-assign');
var contextify = require('contextify');
var invariant = require('invariant');
var recast = require('recast');
var types = recast.types;
var n = types.namedTypes;
var b = types.builders;

function canEvaluate(staticNamespace, exprNode) {
  if (n.Literal.check(exprNode)) {
    return true;
  } else if (n.JSXExpressionContainer.check(exprNode)) {
    return canEvaluate(staticNamespace, exprNode.expression);
  } else if (n.Identifier.check(exprNode) && staticNamespace.hasOwnProperty(exprNode.name)) {
    return true;
  } else if (n.MemberExpression.check(exprNode)) {
    return n.Identifier.check(exprNode.property) && canEvaluate(staticNamespace, exprNode.object);
  } else if (n.BinaryExpression.check(exprNode)) {
    return canEvaluate(staticNamespace, exprNode.left) && canEvaluate(staticNamespace, exprNode.right);
  }
  return false;
}

function getDefaultGetClassNameAndComment() {
  var i = 0;
  return function(node) {
    return {
      className: '__s_' + (i++),
      comment: null,
    };
  };
}

function extractStyles(src, staticNamespace, getClassNameAndComment) {
  invariant(typeof src === 'string', 'You must pass a string src');

  getClassNameAndComment = getClassNameAndComment || getDefaultGetClassNameAndComment();
  staticNamespace = staticNamespace || {};

  invariant(typeof getClassNameAndComment === 'function', 'getClassNameAndComment must be a function');
  invariant(typeof staticNamespace === 'object', 'staticNamespace must be an object');

  var evalContext = assign({}, staticNamespace);
  contextify(evalContext);
  function evaluate(exprNode) {
    return evalContext.run(recast.print(exprNode).code);
  }

  var ast = recast.parse(src);
  var staticStyles = [];

  function transformOpeningElement(node) {
    if (CSSDisplayNames.hasOwnProperty(node.name.name)) {
      // Transform to div with a style attribute.
      var styleAttributes = node.attributes;
      var dynamicAttributes = {};
      var staticAttributes = {};
      var hasDynamicAttributes = false;

      node.attributes.forEach(function(attribute) {
        var name = attribute.name.name;
        var value = attribute.value;

        if (canEvaluate(staticNamespace, value)) {
          staticAttributes[name] = evaluate(value);
        } else {
          dynamicAttributes[name] = value.expression;
          hasDynamicAttributes = true;
        }
      });

      staticAttributes.display = staticAttributes.display || CSSDisplayNames[node.name.name];
      node.name.name = 'div';

      var newAttributes = [];

      staticStyles.push({
        node: node,
        staticAttributes: staticAttributes,
      });

      if (hasDynamicAttributes) {
        var properties = [];
        for (var dynamicPropertyName in dynamicAttributes) {
          properties.push(
            b.property(
              'init',
              b.literal(dynamicPropertyName),
              dynamicAttributes[dynamicPropertyName]
            )
          );
        }

        newAttributes.push(
          b.jsxAttribute(
            b.jsxIdentifier('style'),
            b.jsxExpressionContainer(
              b.objectExpression(properties)
            )
          )
        );
      }

      // Create a style attribute for the dynamic attributes;
      node.attributes = newAttributes;
    }

    return node.name.name;
  }


  recast.visit(ast, {
    visitJSXElement: function(path) {
      var elementName = transformOpeningElement(path.node.openingElement);
      if (path.node.closingElement) {
        path.node.closingElement.name.name = elementName;
      }
      this.traverse(path);
    },
  });

  var css = '';

  staticStyles.forEach(function(entry) {
    var classNameAndComment = getClassNameAndComment(entry);
    var className = classNameAndComment.className;
    invariant(typeof className === 'string', 'className must be a string');

    entry.node.attributes.push(
      b.jsxAttribute(
        b.jsxIdentifier('className'),
        b.literal(className)
      )
    );

    // TODO: we should really make these !important, but it'll be like
    // Marty McFly at the Enchantment Under the Sea dance...
    var comment = (
      classNameAndComment.comment ? '/* ' + classNameAndComment.comment + ' */\n  ' : ''
    );

    var explodedStyles = explodePseudoStyles(entry.staticAttributes);

    css += [
      createCSS(explodedStyles.base, className, comment, null),
      createCSS(explodedStyles.hover, className, comment, ':hover'),
      createCSS(explodedStyles.active, className, comment, ':active'),
      createCSS(explodedStyles.focus, className, comment, ':focus')
    ].join('');
  });

  evalContext.dispose();

  return {
    js: recast.print(ast).code,
    css: css,
  };
}

module.exports = extractStyles;
