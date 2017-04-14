'use strict';

const invariant = require('invariant');
const path = require('path');
const recast = require('recast');
const vm = require('vm');

const jsxstyle = require('jsxstyle');
const explodePseudoStyles = require('jsxstyle/lib/explodePseudoStyles');
const createCSS = require('jsxstyle/lib/createCSS');

const canEvaluate = require('./canEvaluate');
const getPropValueFromAttributes = require('./getPropValueFromAttributes');

const types = recast.types;
const n = types.namedTypes;
const b = types.builders;

function getDefaultGetClassNameAndComment() {
  let i = 0;
  return () => ({
    className: '__s_' + i++,
    commentText: null,
  });
}

function extractStyles(
  // javascript source
  src,
  // name of CSS file that will be required
  cssFileName,
  staticNamespace = {},
  getClassNameAndComment = getDefaultGetClassNameAndComment()
) {
  invariant(typeof src === 'string', 'extractStyles expects a string of javascript as its first param');
  invariant(
    typeof cssFileName === 'string' && path.isAbsolute(cssFileName),
    'extractStyles expects an absolute path to a (virtual) CSS file as its second param'
  );
  invariant(
    typeof staticNamespace === 'object' && staticNamespace !== null,
    'extractStyles expects an object of paths as its third param'
  );
  invariant(typeof getClassNameAndComment === 'function', 'extractStyles expects a function as its fourth param');

  const evalContext = vm.createContext(Object.assign({}, staticNamespace));

  const ast = recast.parse(src);
  const staticStyles = [];

  recast.visit(ast, {
    visitJSXElement(path) {
      const node = path.node.openingElement;
      // TODO: implement a more thorough jsxstyle component check
      if (jsxstyle.hasOwnProperty(node.name.name)) {
        const originalNodeName = node.name.name;
        let firstSpreadIndex = null;
        let lastSpreadIndex = null;
        const spreadOperatorIndices = [];
        const spreadOperatorPropValues = node.attributes
          .filter((attr, idx) => {
            if (n.JSXSpreadAttribute.check(attr)) {
              spreadOperatorIndices.push(idx);
              if (firstSpreadIndex === null) {
                firstSpreadIndex = idx;
              }
              lastSpreadIndex = idx;
            }
          })
          .map(attr => attr.argument);

        const classNamePropValue = getPropValueFromAttributes('className', node.attributes);
        const componentPropValue = getPropValueFromAttributes('component', node.attributes);
        let propsPropValue = null;

        const staticAttributes = {};

        node.attributes = node.attributes.filter((attribute, idx) => {
          if (!attribute.name || !attribute.name.name) {
            // keep the weirdos
            return true;
          }

          // component and className props will be handled elsewhere
          if (attribute.name.name === 'component' || attribute.name.name === 'className') {
            return false;
          }

          // pass style prop through untouched
          if (attribute.name.name === 'style') {
            return true;
          }

          // TODO: implement props prop
          if (attribute.name.name === 'props') {
            propsPropValue = attribute.value;
            // this should always be true
            if (n.jsxExpressionContainer.check(propsPropValue)) {
              propsPropValue = propsPropValue.expression;
            }
            return false;
          }

          // if one or more spread operators are present and we haven't hit the last one yet, continue
          if (lastSpreadIndex !== null && idx <= lastSpreadIndex) {
            return true;
          }

          const name = attribute.name.name;
          const value = attribute.value;

          // if value can be evaluated, extract it and filter it out
          // TODO: extract evaluatable constants from current scope and add to context
          // this would remove the need to explicitly set
          if (canEvaluate(staticNamespace, value)) {
            staticAttributes[name] = vm.runInContext(recast.print(value).code, evalContext);
            return false;
          }

          // if we've made it this far, the prop is here to stay
          return true;
        });

        const propsMinusStyle = node.attributes
          // extract attr.name
          .map(attr => (attr.name ? attr.name.name : null))
          // filter out style
          .filter(attr => attr && attr !== 'style');

        // if all style props have been extracted, jsxstyle component can be converted to a div or the specified component
        // TODO: compare stateless component overhead to normal component overhead
        if (propsMinusStyle.length === 0) {
          Object.assign(staticAttributes, jsxstyle[node.name.name].defaultProps);
          // TODO: props prop

          if (componentPropValue) {
            const evaluatedPropValue = vm.runInNewContext(recast.print(componentPropValue).code);
            if (evaluatedPropValue) {
              node.name.name = evaluatedPropValue;
            } else {
              console.warn('`component` prop was supplied but could not be evaluated');
              node.name.name = 'div';
            }
          } else {
            node.name.name = 'div';
          }
        } else if (lastSpreadIndex !== null) {
          // if only some style props were extracted AND additional props are spread onto the component,
          // add the props back with null values to prevent spread props from incorrectly overwriting the extracted prop value
          Object.keys(staticAttributes).forEach(attr => {
            node.attributes.push(b.jsxAttribute(b.jsxIdentifier(attr), b.jsxExpressionContainer(b.literal(null))));
          });
        }

        staticStyles.push({
          node,
          originalNodeName,
          staticAttributes,
          classNamePropValue,
          spreadOperatorPropValues,
        });
      }

      if (path.node.closingElement) {
        path.node.closingElement.name.name = node.name.name;
      }

      this.traverse(path);
    },
  });

  // Using a map for (officially supported insertion order
  const cssMap = new Map();

  staticStyles.forEach(function(entry) {
    const {className, commentText} = getClassNameAndComment(entry);
    const {node, classNamePropValue} = entry;

    let attributeValue;
    if (classNamePropValue) {
      // if className prop can be evaluated, add it as a literal
      if (canEvaluate({}, classNamePropValue)) {
        // TODO: make sure this is OK
        const evaluatedValue = vm.runInNewContext(recast.print(classNamePropValue).code);
        if (evaluatedValue) {
          if (className) {
            attributeValue = b.literal(`${evaluatedValue} ${className}`);
          } else {
            attributeValue = b.literal(evaluatedValue);
          }
        } else {
          if (className) {
            attributeValue = b.literal(className);
          }
        }
      } else {
        if (className) {
          attributeValue = b.jsxExpressionContainer(
            b.binaryExpression(
              '+',
              b.conditionalExpression(
                // if classNamePropValue
                classNamePropValue,
                // print classNamePropValue with a space
                b.binaryExpression('+', classNamePropValue, b.literal(' ')),
                // else an empty string
                b.literal('')
              ),
              b.literal(className)
            )
          );
        } else {
          attributeValue = classNamePropValue;
        }
      }
    } else if (className) {
      attributeValue = b.literal(className);
    }

    if (attributeValue) {
      node.attributes.push(b.jsxAttribute(b.jsxIdentifier('className'), attributeValue));
    }

    const comment = commentText ? `/* ${commentText} */` : null;

    if (cssMap.has(className)) {
      if (comment) {
        const val = cssMap.get(className);
        val.commentTexts.push(comment);
        cssMap.set(className, val);
      }
    } else {
      const explodedStyles = explodePseudoStyles(entry.staticAttributes);
      const val = {
        css: createCSS(explodedStyles.base, className) +
          createCSS(explodedStyles.hover, className, ':hover') +
          createCSS(explodedStyles.active, className, ':active') +
          createCSS(explodedStyles.focus, className, ':focus'),
        commentTexts: [],
      };

      if (comment) {
        val.commentTexts.push(comment);
      }

      cssMap.set(className, val);
    }
  });

  const css = Array.from(cssMap.values()).map(n => n.commentTexts.map(t => `${t}\n`).join('') + n.css).join('');

  if (css !== '') {
    // append require statement to the document
    // TODO: make sure this doesn't break something valuable
    ast.program.body.unshift(
      b.expressionStatement(b.callExpression(b.identifier('require'), [b.literal(cssFileName)]))
    );
  }

  const result = recast.print(ast);

  return {
    js: result.code,
    map: result.map,
    css,
  };
}

module.exports = extractStyles;
