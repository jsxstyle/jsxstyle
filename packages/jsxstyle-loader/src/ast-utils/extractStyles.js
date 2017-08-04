'use strict';

const invariant = require('invariant');
const path = require('path');
const vm = require('vm');

const jsxstyle = require('jsxstyle');
const getStyleKeysForProps = require('jsxstyle/lib/getStyleKeysForProps');

const canEvaluate = require('./canEvaluate');
const canEvaluateObject = require('./canEvaluateObject');
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
const UNTOUCHED_PROPS = {
  ref: true,
  key: true,
  style: true,
};

// these props cannot appear in the props prop (so meta)
const ALL_SPECIAL_PROPS = Object.assign(
  {
    component: true,
    className: true,
  },
  UNTOUCHED_PROPS
);

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
      const flattenedAttributes = [];
      node.attributes.forEach(attr => {
        if (t.isJSXSpreadAttribute(attr)) {
          if (canEvaluate(staticNamespace, attr.argument)) {
            const spreadValue = vm.runInContext(
              generate(attr.argument).code,
              evalContext
            );

            if (typeof spreadValue !== 'object' || spreadValue === null) {
              lastSpreadIndex = flattenedAttributes.push(attr) - 1;
            } else {
              for (const k in spreadValue) {
                const value = spreadValue[k];

                if (typeof value === 'number') {
                  flattenedAttributes.push(
                    t.jSXAttribute(
                      t.jSXIdentifier(k),
                      t.jSXExpressionContainer(t.numericLiteral(value))
                    )
                  );
                } else if (value === null) {
                  // why would you ever do this
                  flattenedAttributes.push(
                    t.jSXAttribute(
                      t.jSXIdentifier(k),
                      t.jSXExpressionContainer(t.nullLiteral())
                    )
                  );
                } else {
                  // toString anything else
                  // TODO: is this a bad idea
                  flattenedAttributes.push(
                    t.jSXAttribute(
                      t.jSXIdentifier(k),
                      t.jSXExpressionContainer(t.stringLiteral('' + value))
                    )
                  );
                }
              }
            }
          } else {
            lastSpreadIndex = flattenedAttributes.push(attr) - 1;
          }
        } else {
          flattenedAttributes.push(attr);
        }
      });

      node.attributes = flattenedAttributes;

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

        const name = attribute.name.name;
        const value = t.isJSXExpressionContainer(attribute.value)
          ? attribute.value.expression
          : attribute.value;

        // if one or more spread operators are present and we haven't hit the last one yet, the prop stays inline
        if (lastSpreadIndex !== null && idx <= lastSpreadIndex) {
          inlinePropCount++;
          return true;
        }

        // pass ref, key, and style props through untouched
        if (UNTOUCHED_PROPS.hasOwnProperty(name)) {
          return true;
        }

        // className prop will be handled below
        if (name === 'className') {
          return true;
        }

        // validate component prop
        if (name === 'component') {
          if (t.isLiteral(value) && typeof value.value === 'string') {
            const char1 = value.value[0];
            // component="article"
            if (char1 === char1.toUpperCase()) {
              // an uppercase string with be turned into a component, which is not what we want.
              // TODO: look into transforming to React.createElement.
              // main downside is that further transformations that rely on JSX won't work.
              inlinePropCount++;
            }
          } else if (t.isIdentifier(value)) {
            const char1 = value.name[0];
            // component={Avatar}
            if (char1 === char1.toLowerCase()) {
              // a lowercase identifier will be transformed to a DOM element. that's not good.
              inlinePropCount++;
            }
          } else if (t.isMemberExpression(value)) {
            // component={variable.prop}
          } else {
            // TODO: extract more complex expressions out as separate var
            errorCallback(
              '`component` prop value was not handled by extractStyles: ' +
                generate(value).code
            );
            inlinePropCount++;
          }
          return true;
        }

        // pass key and style props through untouched
        if (UNTOUCHED_PROPS.hasOwnProperty(name)) {
          return true;
        }

        if (name === 'props') {
          if (!value) {
            errorCallback('`props` prop does not have a value');
            inlinePropCount++;
            return true;
          }

          if (t.isObjectExpression(value)) {
            let errorCount = 0;
            const attributes = [];

            for (const k in value.properties) {
              const propObj = value.properties[k];
              if (t.isObjectProperty(propObj)) {
                if (ALL_SPECIAL_PROPS.hasOwnProperty(propObj.key.name)) {
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
            t.isCallExpression(value) ||
            // props={wow.cool}
            t.isMemberExpression(value) ||
            // props={wow}
            t.isIdentifier(value)
          ) {
            propsAttributes = [t.jSXSpreadAttribute(value)];
            return true;
          }

          // if props prop is weird-looking, leave it and warn
          errorCallback(
            'props prop is an unhandled type: `' + value.type + '`'
          );
          inlinePropCount++;
          return true;
        }

        if (name === 'mediaQueries') {
          if (canEvaluateObject(staticNamespace, value)) {
            staticAttributes[name] = vm.runInContext(
              // parens so V8 doesn't parse the object like a block
              '(' + generate(value).code + ')',
              evalContext
            );
          } else if (canEvaluate(staticNamespace, value)) {
            staticAttributes[name] = vm.runInContext(
              generate(value).code,
              evalContext
            );
          } else {
            inlinePropCount++;
            return true;
          }
          return false;
        }

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
        // copy default props over if they're not set to something else
        const { defaultProps } = jsxstyle[jsxstyleSrcComponent];
        for (const prop in defaultProps) {
          if (!staticAttributes.hasOwnProperty(prop)) {
            staticAttributes[prop] = defaultProps[prop];
          }
        }
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
          let css = '';
          const styleProps = stylesByClassName[className];

          // get object of style objects
          const styleObjects = getStyleKeysForProps(styleProps, true);
          delete styleObjects.classNameKey;
          const styleObjectKeys = Object.keys(styleObjects).sort();

          for (let idx = -1, len = styleObjectKeys.length; ++idx < len; ) {
            const k = styleObjectKeys[idx];
            const item = styleObjects[k];
            let itemCSS =
              `.${className}` +
              (item.pseudoclass ? ':' + item.pseudoclass : '') +
              (item.pseudoelement ? '::' + item.pseudoelement : '') +
              ` {${item.styles}}`;

            if (item.mediaQuery) {
              itemCSS = `@media ${item.mediaQuery} { ${itemCSS} }`;
            }
            css += itemCSS + '\n';
          }

          cssMap.set(className, { css, commentTexts: [comment] });
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
