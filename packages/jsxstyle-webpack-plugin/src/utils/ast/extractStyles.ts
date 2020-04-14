import generate from '@babel/generator';
import traverse, { NodePath, TraverseOptions } from '@babel/traverse';
import t = require('@babel/types');
import Ajv = require('ajv');
import invariant = require('invariant');
import { componentStyles, getStyleKeysForProps } from 'jsxstyle-utils';
import path = require('path');
import util = require('util');
import vm = require('vm');

import { CacheObject } from '../../types';
import { getStylesByClassName } from '../getStylesByClassName';
import { evaluateAstNode } from './evaluateAstNode';
import { extractStaticTernaries, Ternary } from './extractStaticTernaries';
import { generateUid } from './generatedUid';
import { getPropValueFromAttributes } from './getPropValueFromAttributes';
import { getStaticBindingsForScope } from './getStaticBindingsForScope';
import { parse } from './parse';

type ParserPlugin = import('@babel/parser').ParserPlugin;

import loaderSchema = require('../../loaderSchema.json');

export interface ExtractStylesOptions {
  classNameFormat?: 'hash';
  namedStyleGroups?: Record<string, Record<string, any>>;
  parserPlugins?: ParserPlugin[];
  styleGroups?: Array<Record<string, any>>;
  whitelistedModules?: string[];
  cssModules?: boolean;
  evaluateVars?: boolean;
}

export interface Options {
  cacheObject: CacheObject;
  errorCallback?: (str: string, ...args: any[]) => void;
  warnCallback?: (str: string, ...args: any[]) => void;
}

declare module '@babel/traverse' {
  export interface NodePath<T = t.Node, TNode = any> {
    _complexComponentProp?: t.VariableDeclarator[] | null;
  }
}

// props that will be passed through as-is
const UNTOUCHED_PROPS = {
  key: true,
  style: true,
};

// props that cannot appear in the props prop (so meta)
const ALL_SPECIAL_PROPS = {
  className: true,
  component: true,
  ...UNTOUCHED_PROPS,
};

const JSXSTYLE_SOURCES = {
  jsxstyle: true,
  'jsxstyle/preact': true,
};

const matchMediaHookName = 'useMatchMedia';

const defaultStyleAttributes: Record<string, t.JSXAttribute[]> = {};

for (const componentName in componentStyles) {
  const styleObj =
    componentStyles[componentName as keyof typeof componentStyles];

  // skip `Box`
  if (!styleObj) {
    continue;
  }

  const propKeys = Object.keys(styleObj);
  const styleProps: t.JSXAttribute[] = [];

  for (let idx = -1, len = propKeys.length; ++idx < len; ) {
    const prop = propKeys[idx];
    const value = styleObj[prop];
    if (value == null || value === '') {
      continue;
    }

    let valueEx: t.JSXExpressionContainer | t.StringLiteral;
    if (typeof value === 'number') {
      valueEx = t.jsxExpressionContainer(t.numericLiteral(value));
    } else if (typeof value === 'string') {
      valueEx = t.stringLiteral(value);
    } else {
      throw new Error(
        util.format(
          'Unhandled type `%s` for `%s` component styles',
          typeof value,
          componentName
        )
      );
    }

    styleProps.push(t.jsxAttribute(t.jsxIdentifier(prop), valueEx));
  }

  defaultStyleAttributes[componentName] = styleProps;
}

export function extractStyles(
  src: string | Buffer,
  sourceFileName: string,
  /** non-user-configurable options */
  { cacheObject, warnCallback, errorCallback }: Options,
  options: ExtractStylesOptions = {}
): {
  js: string | Buffer;
  css: string;
  cssFileName: string | null;
  ast: t.File;
  map: any; // RawSourceMap from 'source-map'
} {
  if (typeof src !== 'string') {
    throw new Error('`src` must be a string of javascript');
  }

  invariant(
    typeof sourceFileName === 'string' && path.isAbsolute(sourceFileName),
    '`sourceFileName` must be an absolute path to a .js file'
  );

  invariant(cacheObject != null, '`cacheObject` must be an object');

  let logWarning = console.warn;
  if (typeof warnCallback !== 'undefined') {
    invariant(
      typeof warnCallback === 'function',
      '`warnCallback` is expected to be a function'
    );
    logWarning = warnCallback;
  }

  let logError = console.error;
  if (typeof errorCallback !== 'undefined') {
    invariant(
      typeof errorCallback === 'function',
      '`errorCallback` is expected to be a function'
    );
    logError = errorCallback;
  }

  const ajv = new Ajv({
    allErrors: true,
    errorDataPath: 'property',
    useDefaults: true,
  });

  if (!ajv.validate(loaderSchema, options)) {
    const msg =
      'jsxstyle-webpack-plugin is incorrectly configured:\n' +
      (ajv.errors || [])
        .map((err) => util.format(' - options%s %s', err.dataPath, err.message))
        .join('\n');
    logError(msg);
    throw new Error(msg);
  }

  const {
    classNameFormat,
    namedStyleGroups,
    parserPlugins: _parserPlugins,
    styleGroups,
    whitelistedModules,
    cssModules,
    evaluateVars = true,
  } = options;

  const sourceDir = path.dirname(sourceFileName);

  // Using a map for (officially supported) guaranteed insertion order
  const cssMap = new Map<string, { css: string; commentTexts: string[] }>();

  const parserPlugins = _parserPlugins ? [..._parserPlugins] : [];
  // modify parserPlugins only if the user hasn't specified any plugins
  if (!_parserPlugins) {
    if (/\.tsx?$/.test(sourceFileName)) {
      parserPlugins.push('typescript');
    } else {
      // TODO: is this a bad idea
      parserPlugins.push('flow');
    }
  }

  const ast = parse(src, parserPlugins);

  let jsxstyleSrc: string | null = null;
  const validComponents = {};
  // default to using require syntax
  let useImportSyntax = false;
  let hasValidComponents = false;
  let needsRuntimeJsxstyle = false;
  let matchMediaImportName: string | undefined;

  // Find jsxstyle require in program root
  ast.program.body = ast.program.body.filter((item) => {
    if (t.isVariableDeclaration(item)) {
      item.declarations = item.declarations.filter((dec): boolean => {
        if (
          // var ...
          !t.isVariableDeclarator(dec) ||
          // var {...}
          !t.isObjectPattern(dec.id) ||
          dec.init == null ||
          // var {x} = require(...)
          !t.isCallExpression(dec.init) ||
          !t.isIdentifier(dec.init.callee) ||
          dec.init.callee.name !== 'require' ||
          // var {x} = require('one-thing')
          dec.init.arguments.length !== 1
        ) {
          return true;
        }

        const firstArg = dec.init.arguments[0];
        if (!t.isStringLiteral(firstArg)) {
          return true;
        }

        // var {x} = require('jsxstyle')
        if (!JSXSTYLE_SOURCES.hasOwnProperty(firstArg.value)) {
          return true;
        }

        if (jsxstyleSrc) {
          invariant(
            jsxstyleSrc === firstArg.value,
            'Expected duplicate `require` to be from "%s", received "%s"',
            jsxstyleSrc,
            firstArg.value
          );
        }

        dec.id.properties = dec.id.properties.filter((prop): boolean => {
          // if it's funky, keep it
          if (
            !t.isObjectProperty(prop) ||
            !t.isIdentifier(prop.key) ||
            !t.isIdentifier(prop.value)
          ) {
            return true;
          }

          if (prop.key.name === matchMediaHookName) {
            matchMediaImportName = prop.value.name;
            // retain the import
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

          jsxstyleSrc = firstArg.value;
          return false;
        });

        if (dec.id.properties.length > 0) {
          return true;
        }

        // if all props on the variable declaration have been handled, filter it out
        return false;
      });

      if (item.declarations.length === 0) {
        return false;
      }
    } else if (t.isImportDeclaration(item)) {
      // omfg everyone please just use import syntax

      // not imported from jsxstyle? byeeee
      if (!JSXSTYLE_SOURCES.hasOwnProperty(item.source.value)) {
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

      item.specifiers = item.specifiers.filter((specifier) => {
        // keep the weird stuff
        if (
          !t.isImportSpecifier(specifier) ||
          !t.isIdentifier(specifier.imported) ||
          !t.isIdentifier(specifier.local)
        ) {
          return true;
        }

        if (specifier.imported.name === matchMediaHookName) {
          matchMediaImportName = specifier.local.name;
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
      if (item.specifiers.length === 0) {
        return false;
      }
    }

    return true;
  });

  // jsxstyle isn't included anywhere, so let's bail
  if (jsxstyleSrc == null || !hasValidComponents) {
    return {
      ast,
      css: '',
      cssFileName: null,
      js: src,
      map: null,
    };
  }

  // class or className?
  const classPropName =
    jsxstyleSrc === 'jsxstyle/preact' ? 'class' : 'className';

  // Generate a UID that's unique in the program scope
  let boxComponentName: string = '';
  traverse(ast, {
    Program(traversePath) {
      boxComponentName = generateUid(traversePath.scope, 'Box');
    },
  });

  /** A mapping of binding name to media query string */
  const mediaQueriesByKey: Record<string, string> = {};

  if (matchMediaImportName) {
    // Extract useMatchMedia calls
    // This needs to be done before JSXElement traversal
    const matchMediaTraverseOptions: TraverseOptions<any> = {
      CallExpression(traversePath) {
        const { node } = traversePath;
        if (
          !t.isIdentifier(node.callee) ||
          node.callee.name !== matchMediaImportName ||
          node.arguments.length !== 1
        ) {
          return;
        }

        const firstArg = node.arguments[0];
        // only handling inline string literals for now
        if (!t.isStringLiteral(firstArg)) {
          return;
        }

        const parent = traversePath.parentPath.node;
        if (!t.isVariableDeclarator(parent) || !t.isIdentifier(parent.id)) {
          return;
        }

        // generate a unique ID for this hook call
        // this saves us from having to do scope shenanigans later on
        const uid = generateUid(
          traversePath.parentPath.scope,
          'useMatchMedia_' + parent.id.name
        );
        // rename the hook variable to our generated name
        traversePath.parentPath.scope.rename(parent.id.name, uid);

        mediaQueriesByKey[uid] = firstArg.value;

        // mark hook call as pure so it can be removed if unused
        t.addComment(node, 'leading', '#__PURE__');
      },
    };

    traverse(ast, matchMediaTraverseOptions);
  }

  // per-file cache of evaluated bindings
  const bindingCache: Record<string, string | null> = {};

  const traverseOptions: TraverseOptions<t.JSXElement> = {
    JSXElement: {
      enter(traversePath) {
        const node = traversePath.node.openingElement;

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
        const srcKey = validComponents[originalNodeName];

        let shouldExtractMatchMedia = !!matchMediaImportName;

        node.name.name = boxComponentName;

        // prepend initial styles
        const initialStyles = defaultStyleAttributes[srcKey];
        if (initialStyles) {
          node.attributes = [...initialStyles, ...node.attributes];
        }

        const attemptEval = !evaluateVars
          ? evaluateAstNode
          : (() => {
              // Generate scope object at this level
              const staticNamespace = getStaticBindingsForScope(
                traversePath.scope,
                whitelistedModules,
                sourceFileName,
                bindingCache
              );

              const evalContext = vm.createContext(staticNamespace);

              // called when evaluateAstNode encounters a dynamic-looking prop
              const evalFn = (n: t.Node) => {
                // variable
                if (t.isIdentifier(n)) {
                  invariant(
                    staticNamespace.hasOwnProperty(n.name),
                    'identifier not in staticNamespace'
                  );
                  return staticNamespace[n.name];
                }
                return vm.runInContext(`(${generate(n).code})`, evalContext);
              };

              return (n: t.Node) => evaluateAstNode(n, evalFn);
            })();

        let lastSpreadIndex: number = -1;
        const flattenedAttributes: Array<
          t.JSXAttribute | t.JSXSpreadAttribute
        > = [];
        node.attributes.forEach((attr) => {
          if (
            shouldExtractMatchMedia &&
            t.isJSXAttribute(attr) &&
            typeof attr.name.name === 'string' &&
            attr.name.name === 'mediaQueries'
          ) {
            // the assumption here is that the same file should not contain two different methods of writing media queries
            logWarning(
              'useMatchMedia and the mediaQueries prop should not be mixed. useMatchMedia query extraction will be disabled.'
            );
            shouldExtractMatchMedia = false;
          }

          if (t.isJSXSpreadAttribute(attr)) {
            try {
              const spreadValue = attemptEval(attr.argument);

              if (spreadValue == null) {
                lastSpreadIndex = flattenedAttributes.push(attr) - 1;
              } else {
                for (const k in spreadValue) {
                  const value = spreadValue[k];

                  if (typeof value === 'number') {
                    flattenedAttributes.push(
                      t.jsxAttribute(
                        t.jsxIdentifier(k),
                        t.jsxExpressionContainer(t.numericLiteral(value))
                      )
                    );
                  } else if (value === null) {
                    // why would you ever do this
                    flattenedAttributes.push(
                      t.jsxAttribute(
                        t.jsxIdentifier(k),
                        t.jsxExpressionContainer(t.nullLiteral())
                      )
                    );
                  } else {
                    // toString anything else
                    // TODO: is this a bad idea
                    flattenedAttributes.push(
                      t.jsxAttribute(
                        t.jsxIdentifier(k),
                        t.jsxExpressionContainer(t.stringLiteral('' + value))
                      )
                    );
                  }
                }
              }
            } catch (e) {
              lastSpreadIndex = flattenedAttributes.push(attr) - 1;
            }
          } else {
            flattenedAttributes.push(attr);
          }
        });

        node.attributes = flattenedAttributes;

        let propsAttributes: Array<t.JSXSpreadAttribute | t.JSXAttribute> = [];
        const staticAttributes: Record<string, any> = {};
        const staticAttributesByMediaQuery: Record<
          string,
          Record<string, any>
        > = {};
        let inlinePropCount = 0;

        const staticTernaries: Ternary[] = [];

        node.attributes = node.attributes.filter((attribute, idx) => {
          if (
            t.isJSXSpreadAttribute(attribute) ||
            // keep the weirdos
            !attribute.name ||
            // filter out JSXIdentifiers
            typeof attribute.name.name !== 'string' ||
            // haven't hit the last spread operator
            idx < lastSpreadIndex
          ) {
            inlinePropCount++;
            return true;
          }

          const name = attribute.name.name;
          const value =
            attribute.value && t.isJSXExpressionContainer(attribute.value)
              ? attribute.value.expression
              : attribute.value;

          if (!value) {
            logWarning('`%s` prop does not have a value', name);
            inlinePropCount++;
            return true;
          }

          // if one or more spread operators are present and we haven't hit the last one yet, the prop stays inline
          if (lastSpreadIndex > -1 && idx <= lastSpreadIndex) {
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

          if (name === 'ref') {
            logWarning(
              'The `ref` prop cannot be extracted from a jsxstyle component. ' +
                'If you want to attach a ref to the underlying component ' +
                'or element, specify a `ref` property in the `props` object.'
            );
            inlinePropCount++;
            return true;
          }

          // pass key and style props through untouched
          if (UNTOUCHED_PROPS.hasOwnProperty(name)) {
            return true;
          }

          if (name === 'props') {
            if (t.isObjectExpression(value)) {
              let errorCount = 0;
              const attributes: Array<
                t.JSXAttribute | t.JSXSpreadAttribute
              > = [];

              for (const k in value.properties) {
                const propObj = value.properties[k];

                if (t.isObjectProperty(propObj)) {
                  let key: string | null = null;

                  if (t.isIdentifier(propObj.key)) {
                    key = propObj.key.name;
                  } else if (t.isStringLiteral(propObj.key)) {
                    // starts with a-z or _ followed by a-z, -, or _
                    if (/^\w[\w-]+$/.test(propObj.key.value)) {
                      key = propObj.key.value;
                    } else {
                      logWarning(
                        '`props` prop contains an invalid key: `%s`',
                        propObj.key.value
                      );
                      errorCount++;
                      continue;
                    }
                  } else {
                    logWarning(
                      'unhandled object property key type: `%s`',
                      propObj.type
                    );
                    errorCount++;
                  }

                  if (!key) {
                    continue;
                  }

                  if (ALL_SPECIAL_PROPS.hasOwnProperty(key)) {
                    logWarning(
                      '`props` prop cannot contain `%s` as it is used by jsxstyle and will be overwritten.',
                      key
                    );
                    errorCount++;
                    continue;
                  }

                  if (t.isStringLiteral(propObj.value)) {
                    // convert literal value back to literal to ensure it has double quotes (siiiigh)
                    attributes.push(
                      t.jsxAttribute(
                        t.jsxIdentifier(key),
                        t.stringLiteral(propObj.value.value)
                      )
                    );
                  } else if (
                    t.isExpression(propObj.value) &&
                    !t.isArrayPattern(propObj.value) &&
                    !t.isAssignmentPattern(propObj.value) &&
                    !t.isObjectPattern(propObj.value) &&
                    !t.isRestElement(propObj.value)
                  ) {
                    // wrap everything else in a JSXExpressionContainer
                    attributes.push(
                      t.jsxAttribute(
                        t.jsxIdentifier(key),
                        t.jsxExpressionContainer(propObj.value)
                      )
                    );
                  }
                } else if (t.isSpreadElement(propObj)) {
                  attributes.push(t.jsxSpreadAttribute(propObj.argument));
                } else {
                  logWarning(
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
              propsAttributes = [t.jsxSpreadAttribute(value)];
              return true;
            }

            // if props prop is weird-looking, leave it and warn
            logWarning('props prop is an unhandled type: `%s`', value.type);
            inlinePropCount++;
            return true;
          }

          if (name === 'mediaQueries') {
            try {
              staticAttributes[name] = attemptEval(value);
              return false;
            } catch (e) {
              logWarning(
                'cannot evaluate media query prop: `%s`',
                generate(value).code
              );
              inlinePropCount++;
              return true;
            }
          }

          // if value can be evaluated, extract it and filter it out
          try {
            staticAttributes[name] = attemptEval(value);
            return false;
          } catch (e) {
            //
          }

          if (t.isConditionalExpression(value)) {
            // if both sides of the ternary can be evaluated, extract them
            try {
              const consequent = attemptEval(value.consequent);
              const alternate = attemptEval(value.alternate);

              // check to see if the test is a media query key
              if (shouldExtractMatchMedia && t.isIdentifier(value.test)) {
                const idName = value.test.name;

                if (idName && mediaQueriesByKey.hasOwnProperty(idName)) {
                  const mediaQuery = mediaQueriesByKey[idName];
                  const mqStyles = (staticAttributesByMediaQuery[mediaQuery] =
                    staticAttributesByMediaQuery[mediaQuery] || {});

                  // mediaQueryMatches ? consequent : alternate
                  mqStyles[name] = consequent;
                  staticAttributes[name] = alternate;

                  return false;
                }
              }

              staticTernaries.push({
                alternate,
                consequent,
                name,
                test: value.test,
              });
              // mark the prop as extracted
              staticAttributes[name] = null;
              return false;
            } catch (e) {
              //
            }
          } else if (t.isLogicalExpression(value)) {
            // convert a simple logical expression to a ternary with a null alternate
            if (value.operator === '&&') {
              try {
                const consequent = attemptEval(value.right);

                // check to see if the left-hand side is a media query key
                if (shouldExtractMatchMedia && t.isIdentifier(value.left)) {
                  const idName = value.left.name;

                  if (idName && mediaQueriesByKey.hasOwnProperty(idName)) {
                    const mediaQuery = mediaQueriesByKey[idName];
                    const mqStyles = (staticAttributesByMediaQuery[mediaQuery] =
                      staticAttributesByMediaQuery[mediaQuery] || {});

                    mqStyles[name] = consequent;

                    return false;
                  }
                }

                staticTernaries.push({
                  alternate: null,
                  consequent,
                  name,
                  test: value.left,
                });
                staticAttributes[name] = null;
                return false;
              } catch (e) {
                //
              }
            }
          }

          // if we've made it this far, the prop stays inline
          inlinePropCount++;
          return true;
        });

        let classNamePropValue: t.Expression | null = null;
        const classNamePropIndex = node.attributes.findIndex(
          (attr) =>
            !t.isJSXSpreadAttribute(attr) &&
            attr.name &&
            attr.name.name === classPropName
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
            (attr) =>
              !t.isJSXSpreadAttribute(attr) &&
              attr.name &&
              attr.name.name === 'props'
          );
          // deal with props prop
          if (propsPropIndex > -1) {
            if (propsAttributes.length > 0) {
              propsAttributes.forEach((a) => node.attributes.push(a));
            }
            // delete props prop
            node.attributes.splice(propsPropIndex, 1);
          }

          let componentPropIndex: number = -1;
          let componentAttr: t.JSXAttribute | null = null;
          for (let idx = -1, len = node.attributes.length; ++idx < len; ) {
            const attr = node.attributes[idx];
            if (
              !t.isJSXSpreadAttribute(attr) &&
              attr.name &&
              attr.name.name === 'component'
            ) {
              componentAttr = attr;
              componentPropIndex = idx;
            }
          }

          if (componentAttr && componentAttr.value && componentPropIndex > -1) {
            const componentPropValue = t.isJSXExpressionContainer(
              componentAttr.value
            )
              ? componentAttr.value.expression
              : componentAttr.value;

            let isComplex = true;

            if (
              t.isStringLiteral(componentPropValue) &&
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
              // TODO: user jsxMemberExpression
              node.name.name = generate(componentPropValue).code;
              isComplex = false;
            }

            if (isComplex) {
              // still going to warn since the user should really do this themselves
              logWarning(
                'Complex `component` prop value (`%s`) will be extracted out as a separate variable declaration.',
                generate(componentPropValue).code
              );
              node.name.name = generateUid(traversePath.scope, 'Component');
              if (t.isJSXEmptyExpression(componentPropValue)) {
                logError(
                  'Encountered JSXEmptyExpression: %s',
                  generate(componentPropValue).code
                );
              }
              traversePath._complexComponentProp = [
                t.variableDeclarator(
                  t.identifier(node.name.name),
                  t.isJSXEmptyExpression(componentPropValue)
                    ? t.nullLiteral()
                    : componentPropValue
                ),
              ];
            }

            // remove component prop from attributes
            node.attributes.splice(componentPropIndex, 1);
          } else {
            node.name.name = 'div';
          }
        } else {
          needsRuntimeJsxstyle = true;
          if (lastSpreadIndex > -1) {
            // if only some style props were extracted AND additional props are spread onto the component,
            // add the props back with null values to prevent spread props from incorrectly overwriting the extracted prop value
            Object.keys(staticAttributes).forEach((attr) => {
              node.attributes.push(
                t.jsxAttribute(
                  t.jsxIdentifier(attr),
                  t.jsxExpressionContainer(t.nullLiteral())
                )
              );
            });
          }
        }

        if (traversePath.node.closingElement) {
          // this seems strange
          if (t.isJSXMemberExpression(traversePath.node.closingElement.name)) {
            logWarning('Closing element is a member expression');
            return;
          }
          traversePath.node.closingElement.name.name = node.name.name;
        }

        if (shouldExtractMatchMedia) {
          // transform into old MQ syntax (gross)
          const mediaQueries = Object.keys(staticAttributesByMediaQuery);
          if (mediaQueries.length > 0) {
            const mediaQueriesProp: Record<string, string> = {};
            let idx = 0;
            for (const mq of mediaQueries) {
              const propObj = staticAttributesByMediaQuery[mq];
              const key = `generatedmediaquery${++idx}`;
              mediaQueriesProp[key] = mq;
              for (const propName in propObj) {
                // propName --> generatedmediaquery1PropName
                const prefixedPropName =
                  key + propName[0].toUpperCase() + propName.slice(1);
                staticAttributes[prefixedPropName] = propObj[propName];
              }
            }
            staticAttributes.mediaQueries = mediaQueriesProp;
          }
        }

        const stylesByClassName = getStylesByClassName(
          styleGroups,
          namedStyleGroups,
          staticAttributes,
          cacheObject,
          classNameFormat
        );

        const extractedStyleClassNames = Object.keys(stylesByClassName).join(
          ' '
        );

        const classNameObjects: Array<t.StringLiteral | t.Expression> = [];

        if (classNamePropValue) {
          try {
            const evaluatedValue = attemptEval(classNamePropValue);
            classNameObjects.push(t.stringLiteral(evaluatedValue));
          } catch (e) {
            classNameObjects.push(classNamePropValue);
          }
        }

        if (staticTernaries.length > 0) {
          const ternaryObj = extractStaticTernaries(
            staticTernaries,
            cacheObject,
            classNameFormat
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

        const classNamePropValueForReals = classNameObjects.reduce<t.Expression | null>(
          (acc, val) => {
            if (acc == null) {
              if (
                // pass conditional expressions through
                t.isConditionalExpression(val) ||
                // pass non-null literals through
                t.isStringLiteral(val) ||
                t.isNumericLiteral(val)
              ) {
                return val;
              }
              return t.logicalExpression('||', val, t.stringLiteral(''));
            }

            let inner: t.Expression;
            if (t.isStringLiteral(val)) {
              if (t.isStringLiteral(acc)) {
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
              if (t.isStringLiteral(acc)) {
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
              if (t.isStringLiteral(acc)) {
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
          if (t.isStringLiteral(classNamePropValueForReals)) {
            node.attributes.push(
              t.jsxAttribute(
                t.jsxIdentifier(classPropName),
                t.stringLiteral(classNamePropValueForReals.value)
              )
            );
          } else {
            node.attributes.push(
              t.jsxAttribute(
                t.jsxIdentifier(classPropName),
                t.jsxExpressionContainer(classNamePropValueForReals)
              )
            );
          }
        }

        const lineNumbers =
          node.loc &&
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
              const val = cssMap.get(className)!;
              val.commentTexts.push(comment);
              cssMap.set(className, val);
            }
          } else {
            let css = '';
            const styleProps = stylesByClassName[className];

            // get object of style objects
            const styleObjects = getStyleKeysForProps(styleProps, true);
            if (styleObjects == null) {
              continue;
            }
            const styleObjectKeys = Object.keys(
              styleObjects.stylesByKey
            ).sort();

            for (const k of styleObjectKeys) {
              const item = styleObjects.stylesByKey[k];
              let itemCSS =
                (cssModules ? ':global ' : '') +
                `.${className}` +
                (item.pseudoclass ? ':' + item.pseudoclass : '') +
                (item.pseudoelement ? '::' + item.pseudoelement : '') +
                ` {${item.styles}}`;

              if (item.mediaQuery) {
                itemCSS = `@media ${item.mediaQuery} { ${itemCSS} }`;
              }
              css += itemCSS + '\n';
            }

            if (styleObjects.animations) {
              for (const animationKey in styleObjects.animations) {
                const value = styleObjects.animations[animationKey];
                css += `@keyframes ${animationKey} {${value}}\n`;
              }
            }

            cssMap.set(className, { css, commentTexts: [comment] });
          }
        }
      },
      exit(traversePath) {
        if (traversePath._complexComponentProp) {
          if (t.isJSXElement(traversePath.parentPath)) {
            // bump
            traversePath.parentPath._complexComponentProp = [
              ...(traversePath.parentPath._complexComponentProp || []),
              ...traversePath._complexComponentProp,
            ];
          } else {
            // find nearest Statement
            let statementPath: NodePath<t.JSXElement | t.Node> = traversePath;
            do {
              statementPath = statementPath.parentPath;
            } while (!t.isStatement(statementPath));

            invariant(
              t.isStatement(statementPath),
              'Could not find a statement'
            );

            const decs = t.variableDeclaration('var', [
              ...traversePath._complexComponentProp,
            ]);

            statementPath.insertBefore(decs);
          }
          traversePath._complexComponentProp = null;
        }
      },
    },
  };
  traverse(ast, traverseOptions);

  const resultCSS = Array.from(cssMap.values())
    .map((n) => n.commentTexts.map((txt) => `${txt}\n`).join('') + n.css)
    .join('');
  // path.parse doesn't exist in the webpack'd bundle but path.dirname and path.basename do.
  const extName = path.extname(sourceFileName);
  const baseName = path.basename(sourceFileName, extName);
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
  if (resultCSS !== '') {
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
      compact: 'auto',
      concise: false,
      filename: sourceFileName,
      retainLines: false,
      sourceFileName,
      sourceMaps: true,
    },
    src
  );

  return {
    ast,
    css: resultCSS,
    cssFileName,
    js: result.code,
    map: result.map,
  };
}
