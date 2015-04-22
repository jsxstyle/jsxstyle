'use strict';

var CSSDisplayNames = require('./CSSDisplayNames');
var CSSPropertyOperations = require('react/lib/CSSPropertyOperations');

var contextify = require('contextify');
var recast = require('recast');
var types = recast.types;
var n = types.namedTypes;
var b = types.builders;

function canEvaluate(exprNode) {
  if (n.Literal.check(exprNode)) {
    return true;
  } else if (n.JSXExpressionContainer.check(exprNode)) {
    return canEvaluate(exprNode.expression);
  } else if (n.Identifier.check(exprNode) && exprNode.name === 'StyleConstants') {
    return true;
  } else if (n.MemberExpression.check(exprNode)) {
    return n.Identifier.check(exprNode.property) && canEvaluate(exprNode.object);
  } else if (n.BinaryExpression.check(exprNode)) {
    return canEvaluate(exprNode.left) && canEvaluate(exprNode.right);
  }
  return false;
}

function extractStyles(styleConstants, moduleName, src) {
  var evalContext = {StyleConstants: styleConstants};
  contextify(evalContext);
  function evaluate(exprNode) {
    return evalContext.run(recast.print(exprNode).code);
  }

  var ast = recast.parse(src);
  var staticStyles = [];

  recast.visit(ast, {
    visitJSXOpeningElement: function(path) {
      if (CSSDisplayNames.hasOwnProperty(path.node.name.name)) {
        // Transform to div with a style attribute.
        var styleAttributes = path.node.attributes;
        var dynamicAttributes = {};
        var staticAttributes = {};
        var hasStaticAttributes = false;
        var hasDynamicAttributes = false;

        path.node.attributes.forEach(function(attribute) {
          var name = attribute.name.name;
          var value = attribute.value;

          if (canEvaluate(value)) {
            staticAttributes[name] = evaluate(value);
            hasStaticAttributes = true;
          } else {
            dynamicAttributes[name] = value.expression;
            hasDynamicAttributes = true;
          }
        });

        path.node.name.name = 'div';

        var newAttributes = [];

        if (hasStaticAttributes) {
          if (!staticAttributes.hasOwnProperty('display')) {
            staticAttributes.display = CSSDisplayNames[path.node.name.name];
          }

          staticStyles.push({
            node: path.node,
            staticAttributes: staticAttributes,
          });
        }

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
        path.node.attributes = newAttributes;
      }
      this.traverse(path);
    },
  });

  var css = '';

  staticStyles.forEach(function(entry, i) {
    entry.node.attributes.push(
      b.jsxAttribute(
        b.jsxIdentifier('className'),
        b.literal('_style' + i)
      )
    );
    css += (
      '._s_' + moduleName + '_' + i + '{ ' +
        CSSPropertyOperations.createMarkupForStyles(
          entry.staticAttributes
        ) +
        '}'
    );
  });

  evalContext.dispose();

  return {
    js: recast.print(ast).code,
    css: css,
  };
}

module.exports = extractStyles;
