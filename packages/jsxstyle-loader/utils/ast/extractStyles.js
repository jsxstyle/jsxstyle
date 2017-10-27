'use strict';

const invariant = require('invariant');
const path = require('path');
const vm = require('vm');
const util = require('util');

const { getStyleKeysForProps, componentStyles } = require('jsxstyle-utils');

const canEvaluate = require('./canEvaluate');
const canEvaluateObject = require('./canEvaluateObject');
const extractStaticTernaries = require('./extractStaticTernaries');
const getPropValueFromAttributes = require('./getPropValueFromAttributes');
const getStaticBindingsForScope = require('./getStaticBindingsForScope');
const getStylesByClassName = require('../getStylesByClassName');
const simpleEvaluate = require('./simpleEvaluate');

const generate = require('./generate');
const parse = require('./parse');
const traverse = require('babel-traverse').default;
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

const JSXSTYLE_SOURCES = {
  jsxstyle: true,
  'jsxstyle/preact': true,
};

// InlineBlock --> inline-block
const liteComponents = {};
const ucRegex = /([A-Z])/g;
const defaultStyleAttributes = {};

for (const componentName in componentStyles) {
  const dashCaseName = componentName
    .replace(ucRegex, '-$1')
    .toLowerCase()
    .slice(1);
  liteComponents[dashCaseName] = componentName;

  const styleObj = componentStyles[componentName];

  // skip `Box`
  if (!styleObj) continue;

  const propKeys = Object.keys(styleObj);
  const styleProps = [];

  for (let idx = -1, len = propKeys.length; ++idx < len; ) {
    const prop = propKeys[idx];
    const value = styleObj[prop];
    if (value == null || value === '') {
      continue;
    }

    let valueEx;
    if (typeof value === 'number') {
      valueEx = t.jSXExpressionContainer(t.numericLiteral(value));
    } else if (typeof value === 'string') {
      valueEx = t.stringLiteral(value);
    } else {
      invariant(
        false,
        'Unhandled type `%s` for `%s` component styles',
        typeof value,
        componentName
      );
      continue;
    }

    styleProps.push(t.jSXAttribute(t.jSXIdentifier(prop), valueEx));
  }

  defaultStyleAttributes[componentName] = styleProps;
}

function extractStyles({
  src,
  styleGroups,
  namedStyleGroups,
  sourceFileName,
  whitelistedModules,
  cacheObject,
  parserPlugins: _parserPlugins,
  addCSSRequire,
  errorCallback,
  liteMode,
}) {
  invariant(typeof src === 'string', '`src` must be a string of javascript');

  invariant(
    typeof sourceFileName === 'string' && path.isAbsolute(sourceFileName),
    '`sourceFileName` must be an absolute path to a .js file'
  );

  invariant(
    typeof cacheObject === 'object' && cacheObject !== null,
    '`cacheObject` must be an object'
  );

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

  if (typeof _parserPlugins !== 'undefined') {
    invariant(
      Array.isArray(_parserPlugins),
      '`parserPlugins` must be an array of plugins to be parsed to babylon'
    );
  }

  if (typeof errorCallback !== 'undefined') {
    invariant(
      typeof errorCallback === 'function',
      '`errorCallback` is expected to be a function'
    );
  } else {
    errorCallback = console.warn;
  }

  if (typeof addCSSRequire === 'undefined') {
    addCSSRequire = true;
  }

  const sourceDir = path.dirname(sourceFileName);

  // Using a map for (officially supported) guaranteed insertion order
  const cssMap = new Map();

  const parserPlugins = _parserPlugins ? [].concat(_parserPlugins) : [];
  // modify parserPlugins only if the user hasn't specified any plugins
  if (!_parserPlugins) {
    if (/\.tsx?/.test(sourceFileName)) {
      parserPlugins.push('typescript');
    } else {
      // TODO: is this a bad idea
      parserPlugins.push('flow');
    }
  }

  const ast = parse(src, parserPlugins);

  let jsxstyleSrc;
  const validComponents = {};
  // default to using require syntax
  let useImportSyntax = false;
  let hasValidComponents = false;
  let needsRuntimeJsxstyle = false;

  if (typeof liteMode === 'string' || liteMode === true) {
    if (liteMode === true) {
      jsxstyleSrc = 'jsxstyle';
    } else {
      jsxstyleSrc = liteMode === 'react' ? 'jsxstyle' : `jsxstyle/${liteMode}`;
    }
    Object.assign(validComponents, liteComponents);
    hasValidComponents = true;
  }

  // Find jsxstyle require in program root
  ast.program.body = ast.program.body.filter(item => {
    if (t.isVariableDeclaration(item)) {
      item.declarations = item.declarations.filter(dec => {
        if (
          // var ...
          !t.isVariableDeclarator(dec) ||
          // var {...}
          !t.isObjectPattern(dec.id) ||
          // var {x} = require(...)
          !t.isCallExpression(dec.init) ||
          !t.isIdentifier(dec.init.callee) ||
          dec.init.callee.name !== 'require' ||
          // var {x} = require('one-thing')
          dec.init.arguments.length !== 1 ||
          !t.isStringLiteral(dec.init.arguments[0])
        ) {
          return true;
        }

        // var {x} = require('jsxstyle')
        if (!JSXSTYLE_SOURCES.hasOwnProperty(dec.init.arguments[0].value)) {
          return true;
        }

        if (jsxstyleSrc) {
          invariant(
            jsxstyleSrc === dec.init.arguments[0].value,
            'Expected duplicate `require` to be from "%s", received "%s"',
            jsxstyleSrc,
            dec.init.arguments[0].value
          );
        }

        dec.id.properties = dec.id.properties.filter(prop => {
          // if it's funky, keep it
          if (
            !t.isObjectProperty(prop) ||
            !t.isIdentifier(prop.key) ||
            !t.isIdentifier(prop.value)
          ) {
            return true;
          }

          // only add uppercase identifiers to validComponents
          if (
            !componentStyles.hasOwnProperty(prop.key.name) ||
            prop.value.name[0] !== prop.value.name[0].toUpperCase()
          ) {
            return true;
          }

          // map imported name to source component name
          validComponents[prop.value.name] = prop.key.name;
          hasValidComponents = true;

          jsxstyleSrc = dec.init.arguments[0].value;
          return false;
        });

        if (dec.id.properties.length > 0) return true;

        // if all props on the variable declaration have been handled, filter it out
        return false;
      });

      if (item.declarations.length === 0) return false;
    } else if (t.isImportDeclaration(item)) {
      // omfg everyone please just use import syntax

      // not imported from jsxstyle? byeeee
      if (
        !t.isStringLiteral(item.source) ||
        !JSXSTYLE_SOURCES.hasOwnProperty(item.source.value)
      ) {
        return true;
      }

      if (jsxstyleSrc) {
        invariant(
          jsxstyleSrc === item.source.value,
          'Expected duplicate `import` to be from "%s", received "%s"',
          jsxstyleSrc,
          item.source.value
        );
      }

      jsxstyleSrc = item.source.value;
      useImportSyntax = true;

      item.specifiers = item.specifiers.filter(specifier => {
        // keep the weird stuff
        if (
          !t.isImportSpecifier(specifier) ||
          !t.isIdentifier(specifier.imported) ||
          !t.isIdentifier(specifier.local)
        ) {
          return true;
        }

        if (
          !componentStyles.hasOwnProperty(specifier.imported.name) ||
          specifier.local.name[0] !== specifier.local.name[0].toUpperCase()
        ) {
          return true;
        }

        validComponents[specifier.local.name] = specifier.imported.name;
        hasValidComponents = true;
        return false;
      });

      // remove import
      if (item.specifiers.length === 0) return false;
    }

    return true;
  });

  // jsxstyle isn't included anywhere, so let's bail
  if (!jsxstyleSrc || !hasValidComponents) {
    return {
      js: src,
      css: '',
      cssFileName: null,
      ast,
      map: null,
    };
  }

  // class or className?
  const classPropName =
    jsxstyleSrc === 'jsxstyle/preact' ? 'class' : 'className';

  // Generate a UID that's unique in the program scope
  let boxComponentName;
  traverse(ast, {
    Program(path) {
      boxComponentName = path.scope.generateUid('Box');
    },
  });

  traverse(ast, {
    JSXElement: {
      enter(path) {
        const node = path.node.openingElement;

        if (
          // skip non-identifier opening elements (member expressions, etc.)
          !t.isJSXIdentifier(node.name) ||
          // skip non-jsxstyle components
          !validComponents.hasOwnProperty(node.name.name)
        ) {
          return;
        }

        // Remember the source component
        const originalNodeName = node.name.name;
        const src = validComponents[originalNodeName];

        node.name.name = boxComponentName;

        // prepend initial styles
        const initialStyles = defaultStyleAttributes[src];
        if (initialStyles) {
          node.attributes = [].concat(initialStyles, node.attributes);
        }

        // Generate scope object at this level
        const staticNamespace = getStaticBindingsForScope(
          path.scope,
          whitelistedModules,
          sourceFileName
        );
        const evalContext = vm.createContext(staticNamespace);

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
          if (name === classPropName) {
            return true;
          }

          // component prop will be handled below
          if (name === 'component') {
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
                  let key;

                  if (t.isIdentifier(propObj.key)) {
                    key = propObj.key.name;
                  } else if (t.isStringLiteral(propObj.key)) {
                    // starts with a-z or _ followed by a-z, -, or _
                    if (/^\w[\w-]+$/.test(propObj.key.value)) {
                      key = propObj.key.value;
                    } else {
                      errorCallback(
                        '`props` prop contains an invalid key: `%s`',
                        propObj.key.value
                      );
                      errorCount++;
                      continue;
                    }
                  } else {
                    errorCallback(
                      'unhandled object property key type: `%s`',
                      propObj.type
                    );
                    errorCount++;
                  }

                  if (ALL_SPECIAL_PROPS.hasOwnProperty(key)) {
                    errorCallback(
                      '`props` prop cannot contain `%s` as it is used by jsxstyle and will be overwritten.',
                      key
                    );
                    errorCount++;
                    continue;
                  }

                  if (t.isStringLiteral(propObj.value)) {
                    // convert literal value back to literal to ensure it has double quotes (siiiigh)
                    attributes.push(
                      t.jSXAttribute(
                        t.jSXIdentifier(key),
                        t.stringLiteral(propObj.value.value)
                      )
                    );
                  } else {
                    // wrap everything else in a JSXExpressionContainer
                    attributes.push(
                      t.jSXAttribute(
                        t.jSXIdentifier(key),
                        t.jSXExpressionContainer(propObj.value)
                      )
                    );
                  }
                } else if (t.isSpreadProperty(propObj)) {
                  attributes.push(t.jSXSpreadAttribute(propObj.argument));
                } else {
                  errorCallback(
                    'unhandled object property value type: `%s`',
                    propObj.type
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
            errorCallback('props prop is an unhandled type: `%s`', value.type);
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

        let classNamePropValue;
        const classNamePropIndex = node.attributes.findIndex(
          attr => attr.name && attr.name.name === classPropName
        );
        if (
          classNamePropIndex > -1 &&
          Object.keys(staticAttributes).length > 0
        ) {
          classNamePropValue = getPropValueFromAttributes(
            classPropName,
            node.attributes
          );
          node.attributes.splice(classNamePropIndex, 1);
        }

        // if all style props have been extracted, jsxstyle component can be
        // converted to a div or the specified component
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
            const componentPropValue = t.isJSXExpressionContainer(
              attribute.value
            )
              ? attribute.value.expression
              : attribute.value;

            let isComplex = true;

            if (
              t.isLiteral(componentPropValue) &&
              typeof componentPropValue.value === 'string'
            ) {
              const char1 = componentPropValue.value[0];
              // component="article"
              if (char1 === char1.toLowerCase()) {
                isComplex = false;
                node.name.name = componentPropValue.value;
              }
            } else if (t.isIdentifier(componentPropValue)) {
              const char1 = componentPropValue.name[0];
              // component={Avatar}
              if (char1 === char1.toUpperCase()) {
                isComplex = false;
                node.name.name = componentPropValue.name;
              }
            } else if (t.isMemberExpression(componentPropValue)) {
              // component={variable.prop}
              // TODO: user jSXMemberExpression
              node.name.name = generate(componentPropValue).code;
              isComplex = false;
            }

            if (isComplex) {
              // still going to warn since the user should really do this themselves
              errorCallback(
                'Complex `component` prop value (`%s`) will be extracted out as a separate variable declaration.',
                generate(componentPropValue).code
              );
              node.name.name = path.scope.generateUid('Component');
              path._complexComponentProp = t.variableDeclarator(
                t.identifier(node.name.name),
                componentPropValue
              );
            }

            // remove component prop from attributes
            node.attributes.splice(componentPropIndex, 1);
          } else {
            node.name.name = 'div';
          }
        } else {
          needsRuntimeJsxstyle = true;
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

        const extractedStyleClassNames = Object.keys(stylesByClassName).join(
          ' '
        );

        const classNameObjects = [];

        if (classNamePropValue) {
          try {
            const evaluatedValue = simpleEvaluate(classNamePropValue);
            classNameObjects.push(t.stringLiteral(evaluatedValue));
          } catch (e) {
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

        const classNamePropValueForReals = classNameObjects.reduce(
          (acc, val) => {
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

            const accIsString = t.isStringLiteral(acc);

            let inner;
            if (t.isStringLiteral(val)) {
              if (accIsString) {
                // join adjacent string literals
                return t.stringLiteral(`${acc.value} ${val.value}`);
              }
              inner = t.stringLiteral(` ${val.value}`);
            } else if (t.isLiteral(val)) {
              inner = t.binaryExpression('+', t.stringLiteral(' '), val);
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
          },
          null
        );

        if (classNamePropValueForReals) {
          if (
            t.isLiteral(classNamePropValueForReals) &&
            typeof classNamePropValueForReals.value === 'string'
          ) {
            node.attributes.push(
              t.jSXAttribute(
                t.jSXIdentifier(classPropName),
                t.stringLiteral(classNamePropValueForReals.value)
              )
            );
          } else {
            node.attributes.push(
              t.jSXAttribute(
                t.jSXIdentifier(classPropName),
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

        const comment = util.format(
          '/* %s:%s (%s) */',
          sourceFileName.replace(process.cwd(), '.'),
          lineNumbers,
          originalNodeName
        );

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
      exit(path) {
        if (path._complexComponentProp) {
          if (t.isJSXElement(path.parentPath)) {
            // bump
            path.parentPath._complexComponentProp = [].concat(
              path.parentPath._complexComponentProp || [],
              path._complexComponentProp
            );
          } else {
            // find nearest Statement
            let statementPath = path;
            do {
              statementPath = statementPath.parentPath;
            } while (!t.isStatement(statementPath));

            invariant(
              t.isStatement(statementPath),
              'Could not find a statement'
            );

            const decs = t.variableDeclaration(
              'var',
              [].concat(path._complexComponentProp)
            );

            statementPath.insertBefore(decs);
          }
          path._complexComponentProp = null;
        }
      },
    },
  });

  const css = Array.from(cssMap.values())
    .map(n => n.commentTexts.map(t => `${t}\n`).join('') + n.css)
    .join('');
  // path.parse doesn't exist in the webpack'd bundle but path.dirname and path.basename do.
  const baseName = path.basename(sourceFileName, '.js');
  const cssRelativeFileName = `./${baseName}__jsxstyle.css`;
  const cssFileName = path.join(sourceDir, cssRelativeFileName);

  // Conditionally add Box import/require to the top of the document
  if (needsRuntimeJsxstyle) {
    if (useImportSyntax) {
      ast.program.body.unshift(
        t.importDeclaration(
          [
            t.importSpecifier(
              t.identifier(boxComponentName),
              t.identifier('Box')
            ),
          ],
          t.stringLiteral(jsxstyleSrc)
        )
      );
    } else {
      ast.program.body.unshift(
        t.variableDeclaration('var', [
          t.variableDeclarator(
            t.identifier(boxComponentName),
            t.memberExpression(
              t.callExpression(t.identifier('require'), [
                t.stringLiteral(jsxstyleSrc),
              ]),
              t.identifier('Box')
            )
          ),
        ])
      );
    }
  }

  // append require/import statement to the document
  if (css !== '') {
    if (useImportSyntax) {
      ast.program.body.unshift(
        t.importDeclaration([], t.stringLiteral(cssRelativeFileName))
      );
    } else {
      ast.program.body.unshift(
        t.expressionStatement(
          t.callExpression(t.identifier('require'), [
            t.stringLiteral(cssRelativeFileName),
          ])
        )
      );
    }
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
