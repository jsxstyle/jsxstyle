'use strict';

const invariant = require('invariant');
const path = require('path');
const recast = require('recast');
const vm = require('vm');

const jsxstyle = require('jsxstyle');
const createCSS = require('jsxstyle/lib/createCSS');
const explodePseudoStyles = require('jsxstyle/lib/explodePseudoStyles');

const canEvaluate = require('./canEvaluate');
const extractStaticTernaries = require('./extractStaticTernaries');
const getPropValueFromAttributes = require('./getPropValueFromAttributes');
const getStylesByClassName = require('../getStylesByClassName');
const parse = require('./parse');

const types = recast.types;
const n = types.namedTypes;
const b = types.builders;

// these props will be passed through as-is
const UNTOUCHED_PROPS = ['ref', 'key', 'style'];
// these props cannot appear in the props prop (so meta)
const ALL_SPECIAL_PROPS = ['component', 'className'].concat(UNTOUCHED_PROPS);

const defaultCacheObject = {};
function extractStyles({src, styleGroups, namedStyleGroups, sourceFileName, staticNamespace, cacheObject}) {
  invariant(typeof src === 'string', 'extractStyles expects `src` to be a string of javascript');
  invariant(typeof sourceFileName === 'string', 'extractStyles expects `sourceFileName` to be a path to a .js file');

  if (typeof cacheObject !== 'undefined') {
    invariant(
      typeof cacheObject === 'object' && cacheObject !== null,
      'extractStyles expects `cacheObject` to be an object'
    );
  } else {
    cacheObject = defaultCacheObject;
  }

  if (typeof styleGroups !== 'undefined') {
    invariant(Array.isArray(styleGroups), 'extractStyles expects `styleGroups` to be an array of style prop objects');
  }

  if (typeof namedStyleGroups !== 'undefined') {
    invariant(
      typeof namedStyleGroups === 'object' && namedStyleGroups !== null,
      'extractStyles expects `namedStyleGroups` to be an object of style prop objects keyed by className'
    );
  }

  if (typeof staticNamespace !== 'undefined') {
    invariant(
      typeof staticNamespace === 'object' && staticNamespace !== null,
      'extractStyles expects `staticNamespace` to be an object of objects'
    );
  }

  const evalContext = vm.createContext(staticNamespace ? Object.assign({}, staticNamespace) : {});

  const ast = parse(src, {sourceFileName});

  // Using a map for (officially supported) guaranteed insertion order
  const cssMap = new Map();

  recast.visit(ast, {
    visitJSXElement(path) {
      const node = path.node.openingElement;

      if (
        // skip anything that isn't an identifier (i.e. <thing.cool />)
        !n.JSXIdentifier.check(node.name) ||
        // skip lowercase elements
        node.name.name[0].toUpperCase() !== node.name.name[0] ||
        // skip components not exported by jsxstyle
        !jsxstyle.hasOwnProperty(node.name.name)
      ) {
        this.traverse(path);
        return;
      }

      const originalNodeName = node.name.name;

      let lastSpreadIndex = null;
      node.attributes.forEach((attr, idx) => {
        if (n.JSXSpreadAttribute.check(attr)) {
          lastSpreadIndex = idx;
        }
      });

      let propsAttributes;
      const staticAttributes = {};
      let inlinePropCount = 0;

      const staticTernaries = [];

      node.attributes = node.attributes.filter((attribute, idx) => {
        if (
          // keep the weirdos
          !attribute.name ||
          !attribute.name.name ||
          // haven't hit the last spread operator
          idx < lastSpreadIndex
        ) {
          inlinePropCount++;
          return true;
        }

        // if one or more spread operators are present and we haven't hit the last one yet, the prop stays inline
        if (lastSpreadIndex !== null && idx <= lastSpreadIndex) {
          inlinePropCount++;
          return true;
        }

        // pass ref, key, and style props through untouched
        if (UNTOUCHED_PROPS.indexOf(attribute.name.name) > -1) {
          return true;
        }

        // className prop will be handled below
        if (attribute.name.name === 'className') {
          return true;
        }

        // validate component prop
        if (attribute.name.name === 'component') {
          const componentPropValue = n.JSXExpressionContainer.check(attribute.value)
            ? attribute.value.expression
            : attribute.value;

          if (n.Literal.check(componentPropValue) && typeof componentPropValue.value === 'string') {
            const char1 = componentPropValue.value[0];
            // component="article"
            if (char1 === char1.toUpperCase()) {
              // an uppercase string with be turned into a component, which is not what we want.
              // TODO: look into transforming to React.createElement.
              // main downside is that further transformations that rely on JSX won't work.
              inlinePropCount++;
            }
          } else if (n.Identifier.check(componentPropValue)) {
            const char1 = attribute.value.expression.name[0];
            // component={Avatar}
            if (char1 === char1.toLowerCase()) {
              // a lowercase identifier will be transformed to a DOM element. that's not good.
              inlinePropCount++;
            }
          } else if (n.MemberExpression.check(componentPropValue)) {
            // component={variable.prop}
          } else {
            console.warn(
              '`component` prop value was not handled by extractStyles: `%s`',
              recast.print(componentPropValue).code
            );
            inlinePropCount++;
          }
          return true;
        }

        // pass key and style props through untouched
        if (UNTOUCHED_PROPS.indexOf(attribute.name.name) > -1) {
          return true;
        }

        if (attribute.name.name === 'props') {
          if (!attribute.value) {
            console.warn('`props` prop does not have a value');
            inlinePropCount++;
            return true;
          }
          if (!n.JSXExpressionContainer.check(attribute.value)) {
            console.warn(
              '`props` prop should be wrapped in an expression container. received type `%s`',
              attribute.value.type
            );
            inlinePropCount++;
            return true;
          }

          const propsPropValue = attribute.value.expression;

          if (n.ObjectExpression.check(attribute.value.expression)) {
            let errorCount = 0;
            const attributes = [];

            for (const k in propsPropValue.properties) {
              const propObj = propsPropValue.properties[k];
              if (n.ObjectProperty.check(propObj)) {
                if (ALL_SPECIAL_PROPS.indexOf(propObj.key.name) !== -1) {
                  console.warn(
                    '`props` prop cannot contain `%s` as it is used by jsxstyle and will be overwritten.',
                    propObj.key.name
                  );
                  errorCount++;
                  continue;
                }
                if (n.Literal.check(propObj.value) && typeof propObj.value.value === 'string') {
                  // convert literal value back to literal to ensure it has double quotes (siiiigh)
                  attributes.push(b.jsxAttribute(b.jsxIdentifier(propObj.key.name), b.literal(propObj.value.value)));
                } else {
                  // wrap everything else in a JSXExpressionContainer
                  attributes.push(
                    b.jsxAttribute(b.jsxIdentifier(propObj.key.name), b.jsxExpressionContainer(propObj.value))
                  );
                }
              } else if (n.SpreadProperty.check(propObj)) {
                attributes.push(b.jsxSpreadAttribute(propObj.argument));
              } else {
                console.warn('unhandled object property type: `%s`', propObj.type);
                errorCount++;
              }
            }

            if (errorCount > 0) {
              inlinePropCount++;
            } else {
              propsAttributes = attributes;
            }

            return true;
          }

          if (
            // if it's not an object, spread it
            // props={wow()}
            n.CallExpression.check(propsPropValue) ||
            // props={wow.cool}
            n.MemberExpression.check(propsPropValue) ||
            // props={wow}
            n.Identifier.check(propsPropValue)
          ) {
            propsAttributes = [b.jsxSpreadAttribute(propsPropValue)];
            return true;
          }

          // if props prop is weird-looking, leave it and warn
          console.warn('props prop is an unhandled type: `%s`', attribute.value.expression.type);
          inlinePropCount++;
          return true;
        }

        const name = attribute.name.name;
        const value = attribute.value;

        // if value can be evaluated, extract it and filter it out
        if (canEvaluate(staticNamespace, value)) {
          staticAttributes[name] = vm.runInContext(recast.print(value).code, evalContext);
          return false;
        }

        // expression container with a ternary inside
        if (n.JSXExpressionContainer.check(value) && n.ConditionalExpression.check(value.expression)) {
          // if both sides of the ternary can be evaluated, extract them
          if (
            canEvaluate(staticNamespace, value.expression.consequent) &&
            canEvaluate(staticNamespace, value.expression.alternate)
          ) {
            staticTernaries.push({name, ternary: value.expression});
            // mark the prop as extracted
            staticAttributes[name] = null;
            return false;
          }
        }

        // if we've made it this far, the prop stays inline
        inlinePropCount++;
        return true;
      });

      if (inlinePropCount === 0) {
        Object.assign(staticAttributes, jsxstyle[node.name.name].defaultProps);
      }

      let classNamePropValue;
      const classNamePropIndex = node.attributes.findIndex(attr => attr.name && attr.name.name === 'className');
      if (classNamePropIndex > -1 && Object.keys(staticAttributes).length > 0) {
        classNamePropValue = getPropValueFromAttributes('className', node.attributes);
        node.attributes.splice(classNamePropIndex, 1);
      }

      // if all style props have been extracted, jsxstyle component can be converted to a div or the specified component
      if (inlinePropCount === 0) {
        const propsPropIndex = node.attributes.findIndex(attr => attr.name && attr.name.name === 'props');
        // deal with props prop
        if (propsPropIndex > -1) {
          if (propsAttributes) {
            propsAttributes.forEach(a => node.attributes.push(a));
          }
          // delete props prop
          node.attributes.splice(propsPropIndex, 1);
        }

        const componentPropIndex = node.attributes.findIndex(attr => attr.name && attr.name.name === 'component');
        if (componentPropIndex > -1) {
          const attribute = node.attributes[componentPropIndex];
          const componentPropValue = n.JSXExpressionContainer.check(attribute.value)
            ? attribute.value.expression
            : attribute.value;

          if (n.Literal.check(componentPropValue) && typeof componentPropValue.value === 'string') {
            node.name.name = componentPropValue.value;
          } else if (n.Identifier.check(componentPropValue)) {
            node.name.name = componentPropValue.name;
          } else if (n.MemberExpression.check(componentPropValue)) {
            node.name.name = recast.print(componentPropValue).code;
          }

          // remove component prop from attributes
          node.attributes.splice(componentPropIndex, 1);
        } else {
          node.name.name = 'div';
        }
      } else {
        if (lastSpreadIndex !== null) {
          // if only some style props were extracted AND additional props are spread onto the component,
          // add the props back with null values to prevent spread props from incorrectly overwriting the extracted prop value
          Object.keys(staticAttributes).forEach(attr => {
            node.attributes.push(b.jsxAttribute(b.jsxIdentifier(attr), b.jsxExpressionContainer(b.literal(null))));
          });
        }
      }

      if (path.node.closingElement) {
        path.node.closingElement.name.name = node.name.name;
      }

      const stylesByClassName = getStylesByClassName(styleGroups, namedStyleGroups, staticAttributes, cacheObject);

      const extractedStyleClassNames = Object.keys(stylesByClassName).join(' ');

      const classNameObjects = [];

      if (classNamePropValue) {
        if (canEvaluate({}, classNamePropValue)) {
          classNameObjects.push(b.literal(vm.runInNewContext(recast.print(classNamePropValue).code)));
        } else {
          classNameObjects.push(classNamePropValue);
        }
      }

      if (staticTernaries.length > 0) {
        const ternaryObj = extractStaticTernaries(staticTernaries, evalContext, cacheObject);

        // add extracted styles by className to existing object
        Object.assign(stylesByClassName, ternaryObj.stylesByClassName);

        classNameObjects.push(ternaryObj.ternaryExpression);
      }

      if (extractedStyleClassNames) {
        classNameObjects.push(b.literal(extractedStyleClassNames));
      }

      const classNamePropValueForReals = classNameObjects.reduce((acc, val) => {
        if (!acc) {
          if (
            // pass conditional expressions through
            n.ConditionalExpression.check(val) ||
            // pass non-null literals through
            (n.Literal.check(val) && val.value !== null)
          ) {
            return val;
          }
          return b.logicalExpression('||', val, b.literal(''));
        }

        const accIsString = n.Literal.check(acc) && typeof acc.value === 'string';

        let inner;
        if (n.Literal.check(val)) {
          if (typeof val.value === 'string') {
            if (accIsString) {
              // join adjacent string literals
              return b.literal(`${acc.value} ${val.value}`);
            }
            inner = b.literal(` ${val.value}`);
          } else {
            inner = b.binaryExpression('+', b.literal(' '), val);
          }
        } else if (n.ConditionalExpression.check(val) || n.BinaryExpression.check(val)) {
          if (accIsString) {
            return b.binaryExpression('+', b.literal(`${acc.value} `), val);
          }
          inner = b.binaryExpression('+', b.literal(' '), val);
        } else if (n.Identifier.check(val) || n.MemberExpression.check(val)) {
          // identifiers and member expressions make for reasonable ternaries
          inner = b.conditionalExpression(val, b.binaryExpression('+', b.literal(' '), val), b.literal(''));
        } else {
          process.stderr.write(recast.print(val).code + '\n');
          if (accIsString) {
            return b.binaryExpression('+', b.literal(`${acc.value} `), b.logicalExpression('||', val, b.literal('')));
          }
          // use a logical expression for more complex prop values
          inner = b.binaryExpression('+', b.literal(' '), b.logicalExpression('||', val, b.literal('')));
        }
        return b.binaryExpression('+', acc, inner);
      }, null);

      if (classNamePropValueForReals) {
        if (n.Literal.check(classNamePropValueForReals) && typeof classNamePropValueForReals.value === 'string') {
          node.attributes.push(
            b.jsxAttribute(b.jsxIdentifier('className'), b.literal(classNamePropValueForReals.value))
          );
        } else {
          node.attributes.push(
            b.jsxAttribute(b.jsxIdentifier('className'), b.jsxExpressionContainer(classNamePropValueForReals))
          );
        }
      }

      const lineNumbers =
        node.loc.start.line + (node.loc.start.line !== node.loc.end.line ? `-${node.loc.end.line}` : '');
      const commentText = `${sourceFileName.replace(process.cwd(), '')}:${lineNumbers} (${originalNodeName})`;
      const comment = `/* ${commentText} */`;

      for (const classNameKey in stylesByClassName) {
        if (cssMap.has(classNameKey)) {
          if (comment) {
            const val = cssMap.get(classNameKey);
            val.commentTexts.push(comment);
            cssMap.set(classNameKey, val);
          }
        } else {
          const explodedStyles = explodePseudoStyles(stylesByClassName[classNameKey]);
          const val = {
            css: createCSS(explodedStyles.base, classNameKey) +
              createCSS(explodedStyles.hover, classNameKey, ':hover') +
              createCSS(explodedStyles.active, classNameKey, ':active') +
              createCSS(explodedStyles.focus, classNameKey, ':focus'),
            commentTexts: [],
          };

          if (comment) {
            val.commentTexts.push(comment);
          }

          cssMap.set(classNameKey, val);
        }
      }
      this.traverse(path);
    },
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
