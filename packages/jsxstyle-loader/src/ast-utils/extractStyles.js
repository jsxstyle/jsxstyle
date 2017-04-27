'use strict';

const invariant = require('invariant');
const path = require('path');
const recast = require('recast');
const vm = require('vm');

const jsxstyle = require('jsxstyle');
const createCSS = require('jsxstyle/lib/createCSS');
const explodePseudoStyles = require('jsxstyle/lib/explodePseudoStyles');
const getStyleKeyForStyleObject = require('jsxstyle/lib/getStyleKeyForStyleObject');
const getClassName = require('jsxstyle/lib/getClassName');

const canEvaluate = require('./canEvaluate');
const getPropValueFromAttributes = require('./getPropValueFromAttributes');

const types = recast.types;
const n = types.namedTypes;
const b = types.builders;

function extractStyles({src, sourceFileName, staticNamespace}) {
  invariant(typeof src === 'string', 'extractStyles expects `src` to be a string of javascript');
  invariant(typeof sourceFileName === 'string', 'extractStyles expects `sourceFileName` to be a string');

  if (typeof staticNamespace !== 'undefined') {
    invariant(
      typeof staticNamespace === 'object' && staticNamespace !== null,
      'extractStyles expects `staticNamespace` to be an object of objects'
    );
  }

  const evalContext = vm.createContext(staticNamespace ? Object.assign({}, staticNamespace) : {});

  const ast = recast.parse(src, {
    sourceFileName,
  });
  const staticStyles = [];

  recast.visit(ast, {
    visitJSXElement(path) {
      const node = path.node.openingElement;

      if (
        // if it starts with a capital letter
        node.name.name[0].toUpperCase() === node.name.name[0] &&
        // and is exported by jsxstyle
        jsxstyle.hasOwnProperty(node.name.name)
      ) {
        const originalNodeName = node.name.name;

        let lastSpreadIndex = null;
        node.attributes.forEach((attr, idx) => {
          if (n.JSXSpreadAttribute.check(attr)) {
            lastSpreadIndex = idx;
          }
        });

        const classNamePropValue = getPropValueFromAttributes('className', node.attributes);
        const componentPropValue = getPropValueFromAttributes('component', node.attributes);
        let propsPropValue = null;

        const staticAttributes = {};
        let inlinePropCount = 0;

        node.attributes = node.attributes.filter((attribute, idx) => {
          if (!attribute.name || !attribute.name.name) {
            // keep the weirdos
            inlinePropCount++;
            return true;
          }

          // component and className props will be handled elsewhere
          if (attribute.name.name === 'component' || attribute.name.name === 'className') {
            return false;
          }

          // pass key and style props through untouched
          if (attribute.name.name === 'key' || attribute.name.name === 'style') {
            return true;
          }

          // TODO: implement props prop
          if (attribute.name.name === 'props') {
            propsPropValue = attribute.value;
            // this should always be true
            if (n.JSXExpressionContainer.check(propsPropValue)) {
              propsPropValue = propsPropValue.expression;
            }

            // keep the props prop but do not increment inlinePropCount. if inlinePropCount is 0 when
            // we're done, props prop will be spread. otherwise it will remain in place to preserve order.
            return true;
          }

          // if one or more spread operators are present and we haven't hit the last one yet, the prop stays inline
          if (lastSpreadIndex !== null && idx <= lastSpreadIndex) {
            inlinePropCount++;
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

          // if we've made it this far, the prop stays inline
          inlinePropCount++;
          return true;
        });

        // if all style props have been extracted, jsxstyle component can be converted to a div or the specified component
        if (inlinePropCount === 0) {
          Object.assign(staticAttributes, jsxstyle[node.name.name].defaultProps);

          // deal with props prop
          if (propsPropValue) {
            const propsPropIndex = node.attributes.findIndex(attr => attr.name && attr.name.name === 'props');
            if (propsPropIndex > -1) {
              // remove props prop from attributes
              node.attributes.splice(propsPropIndex, 1);
            }

            if (n.ObjectExpression.check(propsPropValue)) {
              // if it's an object, loop through the properties array and prepend to node.attributes
              for (const k in propsPropValue.properties) {
                const propObj = propsPropValue.properties[k];
                invariant(
                  ['style', 'className'].indexOf(propObj.key.name) === -1,
                  '`props` prop cannot contain `' +
                    propObj.key.name +
                    '` as it is used by jsxstyle and will be overwritten.'
                );
                if (n.Literal.check(propObj.value) && typeof propObj.value.value === 'string') {
                  // convert literal value back to literal to ensure it has double quotes (siiiigh)
                  node.attributes.unshift(
                    b.jsxAttribute(b.jsxIdentifier(propObj.key.name), b.literal(propObj.value.value))
                  );
                } else {
                  // wrap everything else in a JSXExpressionContainer
                  node.attributes.unshift(
                    b.jsxAttribute(b.jsxIdentifier(propObj.key.name), b.jsxExpressionContainer(propObj.value))
                  );
                }
              }
            } else if (
              // if it's not an object, spread it
              // props={wow()}
              n.CallExpression.check(propsPropValue) ||
              // props={wow.cool}
              n.MemberExpression.check(propsPropValue) ||
              // props={wow}
              n.Identifier.check(propsPropValue)
            ) {
              node.attributes.unshift(b.jsxSpreadAttribute(propsPropValue));
            } else {
              invariant(
                false,
                '`props` prop value was not handled by extractStyles: `' + recast.print(propsPropValue).code + '`'
              );
            }
          }

          if (componentPropValue) {
            // TODO: consider converting this to React.createElement to avoid uppercase/lowercase weirdness
            if (n.Literal.check(componentPropValue) && typeof componentPropValue.value === 'string') {
              const char1 = componentPropValue.value[0];
              // component="article"
              invariant(
                char1 === char1.toLowerCase(),
                '`component` prop is a string that starts with an uppercase letter (`' +
                  componentPropValue.value +
                  '`). React will (incorrectly) assume this is a component.'
              );
              node.name.name = componentPropValue.value;
            } else if (n.Identifier.check(componentPropValue)) {
              const char1 = componentPropValue.name[0];
              // component={Avatar}
              invariant(
                char1 === char1.toUpperCase(),
                '`component` prop is an identifier that starts with a lowercase letter (`' +
                  componentPropValue.name +
                  '`). React will (incorrectly) assume this is an HTML element.'
              );
              node.name.name = componentPropValue.name;
            } else if (n.MemberExpression.check(componentPropValue)) {
              // component={variable.prop}
              node.name.name = recast.print(componentPropValue).code;
            } else {
              invariant(
                false,
                '`component` prop value was not handled by extractStyles: `' +
                  recast.print(componentPropValue).code +
                  '`'
              );
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
        });
      }

      if (path.node.closingElement) {
        path.node.closingElement.name.name = node.name.name;
      }

      this.traverse(path);
    },
  });

  // Using a map for (officially supported) guaranteed insertion order
  const cssMap = new Map();

  staticStyles.forEach(({node, originalNodeName, staticAttributes, classNamePropValue}) => {
    const styleKey = getStyleKeyForStyleObject(staticAttributes);
    let className = getClassName(styleKey);
    if (className === '') {
      className = null;
    }

    const lineNumbers =
      node.loc.start.line + (node.loc.start.line !== node.loc.end.line ? `-${node.loc.end.line}` : '');
    const commentText = `/* ${path.relative(process.cwd(), sourceFileName)}:${lineNumbers} (${originalNodeName}) */`;

    let attributeValue;
    if (classNamePropValue) {
      // if className prop can be evaluated, add it as a literal
      if (canEvaluate({}, classNamePropValue)) {
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

    if (cssMap.has(className)) {
      const val = cssMap.get(className);
      val.commentTexts.push(commentText);
      cssMap.set(className, val);
    } else {
      const explodedStyles = explodePseudoStyles(staticAttributes);
      const val = {
        css: createCSS(explodedStyles.base, className) +
          createCSS(explodedStyles.hover, className, ':hover') +
          createCSS(explodedStyles.active, className, ':active') +
          createCSS(explodedStyles.focus, className, ':focus'),
        commentTexts: [commentText],
      };

      cssMap.set(className, val);
    }
  });

  const css = Array.from(cssMap.values()).map(n => n.commentTexts.map(t => `${t}\n`).join('') + n.css).join('');
  // path.parse doesn't exist in the webpack'd bundle but path.dirname and path.basename do.
  const dirName = path.dirname(sourceFileName);
  const baseName = path.basename(sourceFileName, '.js');
  const cssFileName = path.join(dirName, `${baseName}.jsxstyle.css`);
  if (css !== '') {
    // append require statement to the document
    // TODO: make sure this doesn't break something valuable
    ast.program.body.unshift(
      b.expressionStatement(b.callExpression(b.identifier('require'), [b.literal(cssFileName)]))
    );
  }

  const result = recast.print(ast, {
    sourceMapName: path.join(dirName, `${baseName}.json`),
  });

  return {
    js: result.code,
    css,
    cssFileName,
    ast,
    map: result.map,
  };
}

module.exports = extractStyles;
