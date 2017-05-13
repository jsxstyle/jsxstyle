'use strict';

const invariant = require('invariant');
const path = require('path');
const vm = require('vm');

const jsxstyle = require('jsxstyle');
const createCSS = require('jsxstyle/lib/createCSS');
const explodePseudoStyles = require('jsxstyle/lib/explodePseudoStyles');

const canEvaluate = require('./canEvaluate');
const extractStaticTernaries = require('./extractStaticTernaries');
const getPropValueFromAttributes = require('./getPropValueFromAttributes');
const getStylesByClassName = require('../getStylesByClassName');
const getSourceModuleForItem = require('./getSourceModuleForItem');

const parse = require('./parse');
const traverse = require('babel-traverse').default;
const generate = require('babel-generator').default;
const t = require('babel-types');

// these props will be passed through as-is
const UNTOUCHED_PROPS = ['ref', 'key', 'style'];
// these props cannot appear in the props prop (so meta)
const ALL_SPECIAL_PROPS = ['component', 'className'].concat(UNTOUCHED_PROPS);

const defaultCacheObject = {};
function extractStyles({
  src,
  styleGroups,
  namedStyleGroups,
  sourceFileName,
  staticNamespace,
  cacheObject,
  validateComponent,
}) {
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

  // default to true
  if (typeof validateComponent === 'undefined') {
    validateComponent = true;
  }

  const evalContext = vm.createContext(staticNamespace ? Object.assign({}, staticNamespace) : {});

  // Using a map for (officially supported) guaranteed insertion order
  const cssMap = new Map();

  const traverseOptions = {
    JSXElement(path) {
      const node = path.node.openingElement;

      let jsxstyleSrcComponent;
      if (validateComponent) {
        const src = getSourceModuleForItem(node, path.scope);
        if (src === null) {
          return;
        }
        jsxstyleSrcComponent = src.imported;
      } else {
        jsxstyleSrcComponent = node.name.name;
      }

      if (!jsxstyle.hasOwnProperty(jsxstyleSrcComponent)) {
        return;
      }

      const originalNodeName = node.name.name;

      let lastSpreadIndex = null;
      node.attributes.forEach((attr, idx) => {
        if (t.isJSXSpreadAttribute(attr)) {
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
          const componentPropValue = t.isJSXExpressionContainer(attribute.value)
            ? attribute.value.expression
            : attribute.value;

          if (t.isLiteral(componentPropValue) && typeof componentPropValue.value === 'string') {
            const char1 = componentPropValue.value[0];
            // component="article"
            if (char1 === char1.toUpperCase()) {
              // an uppercase string with be turned into a component, which is not what we want.
              // TODO: look into transforming to React.createElement.
              // main downside is that further transformations that rely on JSX won't work.
              inlinePropCount++;
            }
          } else if (t.isIdentifier(componentPropValue)) {
            const char1 = attribute.value.expression.name[0];
            // component={Avatar}
            if (char1 === char1.toLowerCase()) {
              // a lowercase identifier will be transformed to a DOM element. that's not good.
              inlinePropCount++;
            }
          } else if (t.isMemberExpression(componentPropValue)) {
            // component={variable.prop}
          } else {
            // TODO: extract more complex expressions out as separate var
            console.warn(
              '`component` prop value was not handled by extractStyles: `%s`',
              generate(componentPropValue).code
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
          if (!t.isJSXExpressionContainer(attribute.value)) {
            console.warn(
              '`props` prop should be wrapped in an expression container. received type `%s`',
              attribute.value.type
            );
            inlinePropCount++;
            return true;
          }

          const propsPropValue = attribute.value.expression;

          if (t.isObjectExpression(attribute.value.expression)) {
            let errorCount = 0;
            const attributes = [];

            for (const k in propsPropValue.properties) {
              const propObj = propsPropValue.properties[k];
              if (t.isObjectProperty(propObj)) {
                if (ALL_SPECIAL_PROPS.indexOf(propObj.key.name) !== -1) {
                  console.warn(
                    '`props` prop cannot contain `%s` as it is used by jsxstyle and will be overwritten.',
                    propObj.key.name
                  );
                  errorCount++;
                  continue;
                }
                if (t.isStringLiteral(propObj.value)) {
                  // convert literal value back to literal to ensure it has double quotes (siiiigh)
                  attributes.push(
                    t.jSXAttribute(t.jSXIdentifier(propObj.key.name), t.stringLiteral(propObj.value.value))
                  );
                } else {
                  // wrap everything else in a JSXExpressionContainer
                  attributes.push(
                    t.jSXAttribute(t.jSXIdentifier(propObj.key.name), t.jSXExpressionContainer(propObj.value))
                  );
                }
              } else if (t.isSpreadProperty(propObj)) {
                attributes.push(t.jSXSpreadAttribute(propObj.argument));
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
            t.isCallExpression(propsPropValue) ||
            // props={wow.cool}
            t.isMemberExpression(propsPropValue) ||
            // props={wow}
            t.isIdentifier(propsPropValue)
          ) {
            propsAttributes = [t.jSXSpreadAttribute(propsPropValue)];
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
          staticAttributes[name] = vm.runInContext(generate(value).code, evalContext);
          return false;
        }

        if (t.isJSXExpressionContainer(value)) {
          if (t.isConditionalExpression(value.expression)) {
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
          } else if (t.isLogicalExpression(value.expression)) {
            // convert a simple logical expression to a ternary with a null alternate
            if (value.expression.operator === '&&' && canEvaluate(staticNamespace, value.expression.right)) {
              staticTernaries.push({
                name,
                ternary: {
                  test: value.expression.left,
                  consequent: value.expression.right,
                  alternate: t.nullLiteral(),
                },
              });
              staticAttributes[name] = null;
              return false;
            }
          }
        }

        // if we've made it this far, the prop stays inline
        inlinePropCount++;
        return true;
      });

      if (inlinePropCount === 0) {
        Object.assign(staticAttributes, jsxstyle[jsxstyleSrcComponent].defaultProps);
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
          const componentPropValue = t.isJSXExpressionContainer(attribute.value)
            ? attribute.value.expression
            : attribute.value;

          if (t.isLiteral(componentPropValue) && typeof componentPropValue.value === 'string') {
            node.name.name = componentPropValue.value;
          } else if (t.isIdentifier(componentPropValue)) {
            node.name.name = componentPropValue.name;
          } else if (t.isMemberExpression(componentPropValue)) {
            node.name.name = generate(componentPropValue).code;
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
            node.attributes.push(t.jSXAttribute(t.jSXIdentifier(attr), t.jSXExpressionContainer(t.nullLiteral())));
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
          // TODO: don't use canEvaluate here, need to be more specific
          classNameObjects.push(t.stringLiteral(vm.runInNewContext(generate(classNamePropValue).code)));
        } else {
          classNameObjects.push(classNamePropValue);
        }
      }

      if (staticTernaries.length > 0) {
        const ternaryObj = extractStaticTernaries(staticTernaries, evalContext, cacheObject);

        // ternaryObj is null if all of the extracted ternaries have falsey consequents and alternates
        if (ternaryObj !== null) {
          // add extracted styles by className to existing object
          Object.assign(stylesByClassName, ternaryObj.stylesByClassName);
          classNameObjects.push(ternaryObj.ternaryExpression);
        }
      }

      if (extractedStyleClassNames) {
        classNameObjects.push(t.stringLiteral(extractedStyleClassNames));
      }

      const classNamePropValueForReals = classNameObjects.reduce((acc, val) => {
        if (!acc) {
          if (
            // pass conditional expressions through
            t.isConditionalExpression(val) ||
            // pass non-null literals through
            (t.isLiteral(val) && val.value !== null)
          ) {
            return val;
          }
          return t.logicalExpression('||', val, t.stringLiteral(''));
        }

        const accIsString = t.isLiteral(acc) && typeof acc.value === 'string';

        let inner;
        if (t.isLiteral(val)) {
          if (typeof val.value === 'string') {
            if (accIsString) {
              // join adjacent string literals
              return t.stringLiteral(`${acc.value} ${val.value}`);
            }
            inner = t.stringLiteral(` ${val.value}`);
          } else {
            inner = t.binaryExpression('+', t.stringLiteral(' '), val);
          }
        } else if (t.isConditionalExpression(val) || t.isBinaryExpression(val)) {
          if (accIsString) {
            return t.binaryExpression('+', t.stringLiteral(`${acc.value} `), val);
          }
          inner = t.binaryExpression('+', t.stringLiteral(' '), val);
        } else if (t.isIdentifier(val) || t.isMemberExpression(val)) {
          // identifiers and member expressions make for reasonable ternaries
          inner = t.conditionalExpression(val, t.binaryExpression('+', t.stringLiteral(' '), val), t.stringLiteral(''));
        } else {
          process.stderr.write(generate(val).code + '\n');
          if (accIsString) {
            return t.binaryExpression(
              '+',
              t.stringLiteral(`${acc.value} `),
              t.logicalExpression('||', val, t.stringLiteral(''))
            );
          }
          // use a logical expression for more complex prop values
          inner = t.binaryExpression('+', t.stringLiteral(' '), t.logicalExpression('||', val, t.stringLiteral('')));
        }
        return t.binaryExpression('+', acc, inner);
      }, null);

      if (classNamePropValueForReals) {
        if (t.isLiteral(classNamePropValueForReals) && typeof classNamePropValueForReals.value === 'string') {
          node.attributes.push(
            t.jSXAttribute(t.jSXIdentifier('className'), t.stringLiteral(classNamePropValueForReals.value))
          );
        } else {
          node.attributes.push(
            t.jSXAttribute(t.jSXIdentifier('className'), t.jSXExpressionContainer(classNamePropValueForReals))
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
    },
  };

  const ast = parse(src, {sourceFileName});

  traverse(ast, traverseOptions);

  const css = Array.from(cssMap.values()).map(n => n.commentTexts.map(t => `${t}\n`).join('') + n.css).join('');
  // path.parse doesn't exist in the webpack'd bundle but path.dirname and path.basename do.
  const dirName = path.dirname(sourceFileName);
  const baseName = path.basename(sourceFileName, '.js');
  const cssFileName = path.join(dirName, `${baseName}.jsxstyle.css`);
  if (css !== '') {
    // append require statement to the document
    // TODO: make sure this doesn't break something valuable
    ast.program.body.unshift(
      t.expressionStatement(t.callExpression(t.identifier('require'), [t.stringLiteral(cssFileName)]))
    );
  }

  const result = generate(
    ast,
    {
      fileName: sourceFileName,
      retainLines: false,
      compact: 'auto',
      concise: false,
      sourceMaps: true,
      sourceFileName,
      quotes: 'single',
    },
    src
  );

  return {
    js: result.code,
    css,
    cssFileName,
    ast: result.ast,
    map: result.map,
  };
}

module.exports = extractStyles;
