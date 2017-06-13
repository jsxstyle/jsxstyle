'use strict';

const invariant = require('invariant');
const path = require('path');
const vm = require('vm');

const jsxstyle = require('jsxstyle');
const createMarkupForStyles = require('jsxstyle/lib/createMarkupForStyles');
const explodePseudoStyles = require('jsxstyle/lib/explodePseudoStyles');

const canEvaluate = require('./canEvaluate');
const extractStaticTernaries = require('./extractStaticTernaries');
const getPropValueFromAttributes = require('./getPropValueFromAttributes');
const getSourceModuleForItem = require('./getSourceModuleForItem');
const getStaticBindingsForScope = require('./getStaticBindingsForScope');
const getStylesByClassName = require('../getStylesByClassName');

const parse = require('./parse');
const traverse = require('babel-traverse').default;
const generate = require('babel-generator').default;
const t = require('babel-types');

// these props will be passed through as-is
const UNTOUCHED_PROPS = ['ref', 'key', 'style'];
// these props cannot appear in the props prop (so meta)
const ALL_SPECIAL_PROPS = ['component', 'className'].concat(UNTOUCHED_PROPS);

function noop() {}

const defaultCacheObject = {};
function extractStyles({
  src,
  styleGroups,
  namedStyleGroups,
  sourceFileName,
  whitelistedModules,
  cacheObject,
  validateComponent,
  errorCallback,
}) {
  invariant(typeof src === 'string', '`src` must be a string of javascript');

  invariant(
    typeof sourceFileName === 'string' && path.isAbsolute(sourceFileName),
    '`sourceFileName` must be an absolute path to a .js file'
  );

  if (typeof cacheObject !== 'undefined') {
    invariant(
      typeof cacheObject === 'object' && cacheObject !== null,
      '`cacheObject` must be an object'
    );
  } else {
    cacheObject = defaultCacheObject;
  }

  if (typeof styleGroups !== 'undefined') {
    invariant(
      Array.isArray(styleGroups),
      '`styleGroups` must be an array of style prop objects'
    );
  }

  if (typeof namedStyleGroups !== 'undefined') {
    invariant(
      typeof namedStyleGroups === 'object' && namedStyleGroups !== null,
      '`namedStyleGroups` must be an object of style prop objects keyed by className'
    );
  }

  if (typeof whitelistedModules !== 'undefined') {
    invariant(
      Array.isArray(whitelistedModules),
      '`whitelistedModules` must be an array of paths to modules that are OK to require'
    );
  }

  if (typeof errorCallback !== 'undefined') {
    invariant(
      typeof errorCallback === 'function',
      '`errorCallback` is expected to be a function'
    );
  } else {
    errorCallback = noop;
  }

  // default to true
  if (typeof validateComponent === 'undefined') {
    validateComponent = true;
  }

  // Using a map for (officially supported) guaranteed insertion order
  const cssMap = new Map();

  const traverseOptions = {
    JSXElement(path) {
      const node = path.node.openingElement;

      if (
        // skip non-identifier opening elements (member expressions, etc.)
        !t.isJSXIdentifier(node.name) ||
        // skip elements that are not components
        node.name.name === node.name.name.toLowerCase()
      ) {
        return;
      }

      // TODO: build this lazily? no sense in building a whole context object if it's not needed
      const staticNamespace = getStaticBindingsForScope(
        path.scope,
        whitelistedModules,
        sourceFileName
      );

      // console.log(sourceFileName);
      // console.log(
      //   'staticNamespace for %s:\n%s\n\n-----\n',
      //   node.name.name,
      //   JSON.stringify(staticNamespace, null, '  ')
      // );

      const evalContext = vm.createContext(staticNamespace);

      let jsxstyleSrcComponent;
      if (validateComponent) {
        const src = getSourceModuleForItem(
          node.name.name,
          path.scope,
          errorCallback
        );
        if (src === null || src.sourceModule !== 'jsxstyle') {
          return;
        }
        if (!src.destructured) {
          console.error(
            'jsxstyle-loader only supports destructured import/require syntax'
          );
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

          if (
            t.isLiteral(componentPropValue) &&
            typeof componentPropValue.value === 'string'
          ) {
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
            errorCallback(
              '`component` prop value was not handled by extractStyles: ' +
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
            errorCallback('`props` prop does not have a value');
            inlinePropCount++;
            return true;
          }
          if (!t.isJSXExpressionContainer(attribute.value)) {
            errorCallback(
              '`props` prop should be wrapped in an expression container. received type `' +
                attribute.value.type +
                '`'
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
                  errorCallback(
                    '`props` prop cannot contain `' +
                      propObj.key.name +
                      '` as it is used by jsxstyle and will be overwritten.'
                  );
                  errorCount++;
                  continue;
                }
                if (t.isStringLiteral(propObj.value)) {
                  // convert literal value back to literal to ensure it has double quotes (siiiigh)
                  attributes.push(
                    t.jSXAttribute(
                      t.jSXIdentifier(propObj.key.name),
                      t.stringLiteral(propObj.value.value)
                    )
                  );
                } else {
                  // wrap everything else in a JSXExpressionContainer
                  attributes.push(
                    t.jSXAttribute(
                      t.jSXIdentifier(propObj.key.name),
                      t.jSXExpressionContainer(propObj.value)
                    )
                  );
                }
              } else if (t.isSpreadProperty(propObj)) {
                attributes.push(t.jSXSpreadAttribute(propObj.argument));
              } else {
                errorCallback(
                  'unhandled object property type: `' + propObj.type + +'`'
                );
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
          errorCallback(
            'props prop is an unhandled type: `' +
              attribute.value.expression.type +
              '`'
          );
          inlinePropCount++;
          return true;
        }

        const name = attribute.name.name;
        const value = t.isJSXExpressionContainer(attribute.value)
          ? attribute.value.expression
          : attribute.value;

        // if value can be evaluated, extract it and filter it out
        if (canEvaluate(staticNamespace, value)) {
          staticAttributes[name] = vm.runInContext(
            generate(value).code,
            evalContext
          );
          return false;
        }

        if (t.isConditionalExpression(value)) {
          // if both sides of the ternary can be evaluated, extract them
          if (
            canEvaluate(staticNamespace, value.consequent) &&
            canEvaluate(staticNamespace, value.alternate)
          ) {
            staticTernaries.push({ name, ternary: value });
            // mark the prop as extracted
            staticAttributes[name] = null;
            return false;
          }
        } else if (t.isLogicalExpression(value)) {
          // convert a simple logical expression to a ternary with a null alternate
          if (
            value.operator === '&&' &&
            canEvaluate(staticNamespace, value.right)
          ) {
            staticTernaries.push({
              name,
              ternary: {
                test: value.left,
                consequent: value.right,
                alternate: t.nullLiteral(),
              },
            });
            staticAttributes[name] = null;
            return false;
          }
        }

        // if we've made it this far, the prop stays inline
        inlinePropCount++;
        return true;
      });

      if (inlinePropCount === 0) {
        Object.assign(
          staticAttributes,
          jsxstyle[jsxstyleSrcComponent].defaultProps
        );
      }

      let classNamePropValue;
      const classNamePropIndex = node.attributes.findIndex(
        attr => attr.name && attr.name.name === 'className'
      );
      if (classNamePropIndex > -1 && Object.keys(staticAttributes).length > 0) {
        classNamePropValue = getPropValueFromAttributes(
          'className',
          node.attributes
        );
        node.attributes.splice(classNamePropIndex, 1);
      }

      // if all style props have been extracted, jsxstyle component can be converted to a div or the specified component
      if (inlinePropCount === 0) {
        const propsPropIndex = node.attributes.findIndex(
          attr => attr.name && attr.name.name === 'props'
        );
        // deal with props prop
        if (propsPropIndex > -1) {
          if (propsAttributes) {
            propsAttributes.forEach(a => node.attributes.push(a));
          }
          // delete props prop
          node.attributes.splice(propsPropIndex, 1);
        }

        const componentPropIndex = node.attributes.findIndex(
          attr => attr.name && attr.name.name === 'component'
        );
        if (componentPropIndex > -1) {
          const attribute = node.attributes[componentPropIndex];
          const componentPropValue = t.isJSXExpressionContainer(attribute.value)
            ? attribute.value.expression
            : attribute.value;

          if (
            t.isLiteral(componentPropValue) &&
            typeof componentPropValue.value === 'string'
          ) {
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
            node.attributes.push(
              t.jSXAttribute(
                t.jSXIdentifier(attr),
                t.jSXExpressionContainer(t.nullLiteral())
              )
            );
          });
        }
      }

      if (path.node.closingElement) {
        path.node.closingElement.name.name = node.name.name;
      }

      const stylesByClassName = getStylesByClassName(
        styleGroups,
        namedStyleGroups,
        staticAttributes,
        cacheObject
      );

      const extractedStyleClassNames = Object.keys(stylesByClassName).join(' ');

      const classNameObjects = [];

      if (classNamePropValue) {
        if (canEvaluate(null, classNamePropValue)) {
          // TODO: don't use canEvaluate here, need to be more specific
          classNameObjects.push(
            t.stringLiteral(
              vm.runInNewContext(generate(classNamePropValue).code)
            )
          );
        } else {
          classNameObjects.push(classNamePropValue);
        }
      }

      if (staticTernaries.length > 0) {
        const ternaryObj = extractStaticTernaries(
          staticTernaries,
          evalContext,
          cacheObject
        );

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
        } else if (
          t.isConditionalExpression(val) ||
          t.isBinaryExpression(val)
        ) {
          if (accIsString) {
            return t.binaryExpression(
              '+',
              t.stringLiteral(`${acc.value} `),
              val
            );
          }
          inner = t.binaryExpression('+', t.stringLiteral(' '), val);
        } else if (t.isIdentifier(val) || t.isMemberExpression(val)) {
          // identifiers and member expressions make for reasonable ternaries
          inner = t.conditionalExpression(
            val,
            t.binaryExpression('+', t.stringLiteral(' '), val),
            t.stringLiteral('')
          );
        } else {
          if (accIsString) {
            return t.binaryExpression(
              '+',
              t.stringLiteral(`${acc.value} `),
              t.logicalExpression('||', val, t.stringLiteral(''))
            );
          }
          // use a logical expression for more complex prop values
          inner = t.binaryExpression(
            '+',
            t.stringLiteral(' '),
            t.logicalExpression('||', val, t.stringLiteral(''))
          );
        }
        return t.binaryExpression('+', acc, inner);
      }, null);

      if (classNamePropValueForReals) {
        if (
          t.isLiteral(classNamePropValueForReals) &&
          typeof classNamePropValueForReals.value === 'string'
        ) {
          node.attributes.push(
            t.jSXAttribute(
              t.jSXIdentifier('className'),
              t.stringLiteral(classNamePropValueForReals.value)
            )
          );
        } else {
          node.attributes.push(
            t.jSXAttribute(
              t.jSXIdentifier('className'),
              t.jSXExpressionContainer(classNamePropValueForReals)
            )
          );
        }
      }

      const lineNumbers =
        node.loc.start.line +
        (node.loc.start.line !== node.loc.end.line
          ? `-${node.loc.end.line}`
          : '');
      // prettier-ignore
      const comment = `/* ${sourceFileName.replace(process.cwd(), '.')}:${lineNumbers} (${originalNodeName}) */`;

      for (const className in stylesByClassName) {
        if (cssMap.has(className)) {
          if (comment) {
            const val = cssMap.get(className);
            val.commentTexts.push(comment);
            cssMap.set(className, val);
          }
        } else {
          const explodedStyles = explodePseudoStyles(
            stylesByClassName[className]
          );

          const baseCSS = createMarkupForStyles(
            explodedStyles.base,
            errorCallback
          );
          const hoverCSS = createMarkupForStyles(
            explodedStyles.hover,
            errorCallback
          );
          const activeCSS = createMarkupForStyles(
            explodedStyles.active,
            errorCallback
          );
          const focusCSS = createMarkupForStyles(
            explodedStyles.focus,
            errorCallback
          );

          let cssString = '';
          if (baseCSS) {
            cssString += `.${className} {${baseCSS}}\n`;
          }
          if (hoverCSS) {
            cssString += `.${className}:hover {${hoverCSS}}\n`;
          }
          if (activeCSS) {
            cssString += `.${className}:active {${activeCSS}}\n`;
          }
          if (focusCSS) {
            cssString += `.${className}:focus {${focusCSS}}\n`;
          }

          const val = {
            css: cssString,
            commentTexts: [],
          };

          if (comment) {
            val.commentTexts.push(comment);
          }

          cssMap.set(className, val);
        }
      }
    },
  };

  const ast = parse(src, { sourceFileName });

  traverse(ast, traverseOptions);

  const css = Array.from(cssMap.values())
    .map(n => n.commentTexts.map(t => `${t}\n`).join('') + n.css)
    .join('');
  // path.parse doesn't exist in the webpack'd bundle but path.dirname and path.basename do.
  const dirName = path.dirname(sourceFileName);
  const baseName = path.basename(sourceFileName, '.js');
  const cssRelativeFileName = `./${baseName}.jsxstyle.css`;
  const cssFileName = path.join(dirName, cssRelativeFileName);
  if (css !== '') {
    // append require statement to the document
    // TODO: make sure this doesn't break something valuable
    ast.program.body.unshift(
      t.expressionStatement(
        t.callExpression(t.identifier('require'), [
          t.stringLiteral(cssRelativeFileName),
        ])
      )
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
