/* eslint-disable no-prototype-builtins */
import type { ParserPlugin } from '@babel/parser';
import type { NodePath, TraverseOptions } from '@babel/traverse';
import * as t from '@babel/types';
import { codeFrameColumns } from '@babel/code-frame';
import invariant from 'invariant';
import { componentStyles, processProps } from '../../../jsxstyle-utils/src';
import path from 'path';
import util from 'util';

import { evaluateAstNode } from './evaluateAstNode';
import { getEvaluateAstNodeWithScopeFunction } from './getEvaluateAstNodeWithScopeFunction';
import { extractStaticTernaries, Ternary } from './extractStaticTernaries';
import { generateUid } from './generatedUid';
import { getInlineImportString } from './getInlineImportString';
import { getPropValueFromAttributes } from './getPropValueFromAttributes';
import { extensionRegex } from './getStaticBindingsForScope';
import { parse } from './babelUtils';
import { getImportForSource } from './getImportForSource';
import type { GetClassNameForKeyFn } from '../../../jsxstyle-utils/src';
import {
  generateCustomPropertiesFromVariants,
  VariantMap,
} from '../../../jsxstyle-utils/src/generateCustomPropertiesFromVariants';
import {
  makeCssFunction,
  type CssFunction,
} from '../../../jsxstyle-utils/src/makeCssFunction';
import { StyleCache } from '../../../jsxstyle-utils/src/getStyleCache';
import { generate, traverse } from './babelUtils';
import { commonComponentProps } from '../../../jsxstyle-utils/src/parseStyleProps';

const validCssModes = [
  'singleInlineImport',
  'multipleInlineImports',
  'styled-jsx',
] as const;

export interface UserConfigurableOptions {
  parserPlugins?: ParserPlugin[];
  cssMode?: (typeof validCssModes)[number];
  /** Emit an error if runtime jsxstyle sticks around */
  noRuntime?: boolean;
}

export interface ExtractStylesOptions {
  errorCallback?: (str: string, ...args: any[]) => void;
  warnCallback?: (str: string, ...args: any[]) => void;
  evaluateVars?: boolean;
  getClassNameForKey: GetClassNameForKeyFn;
  modulesByAbsolutePath?: Record<string, unknown>;
}

declare module '@babel/traverse' {
  export interface NodePath {
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
  class: true,
  className: true,
  component: true,
  ...UNTOUCHED_PROPS,
};

const JSXSTYLE_SOURCES = {
  jsxstyle: true,
  'jsxstyle/preact': true,
  'jsxstyle/solid': true,
};

const matchMediaHookName = 'useMatchMedia';
const customPropertiesFunctionName = 'makeCustomProperties';
const cssFunctionName = 'css';

const defaultStyleAttributes = Object.entries(componentStyles).reduce<
  Record<string, t.JSXAttribute[]>
>((attrs, [componentName, styleObj]) => {
  // skip `Box`
  if (!styleObj) {
    return attrs;
  }

  attrs[componentName] = Object.entries(styleObj).reduce<t.JSXAttribute[]>(
    (props, [propKey, propValue]) => {
      if (propValue == null) {
        return props;
      }

      let valueEx: t.JSXExpressionContainer | t.StringLiteral;
      if (typeof propValue === 'number') {
        valueEx = t.jsxExpressionContainer(t.numericLiteral(propValue));
      } else if (typeof propValue === 'string') {
        valueEx = t.stringLiteral(propValue);
      } else {
        throw new Error(
          util.format(
            'Unhandled type `%s` for `%s` component styles',
            typeof propValue,
            componentName
          )
        );
      }

      props.push(t.jsxAttribute(t.jsxIdentifier(propKey), valueEx));
      return props;
    },
    []
  );

  return attrs;
}, {});

export function extractStyles(
  src: string | Buffer,
  sourceFileName: string,
  /** non-user-configurable options */
  extractStylesOptions: ExtractStylesOptions,
  options: UserConfigurableOptions = {}
): {
  js: string | Buffer;
  css: string;
  cssFileName: string | null;
  ast: t.File;
  map: any; // RawSourceMap from 'source-map'
} {
  const {
    warnCallback,
    errorCallback,
    getClassNameForKey,
    evaluateVars = true,
  } = extractStylesOptions;

  const noRuntimeMode = options.noRuntime;

  invariant(typeof src === 'string', '`src` must be a string of javascript');

  invariant(
    typeof sourceFileName === 'string' && path.isAbsolute(sourceFileName),
    '`sourceFileName` must be an absolute path to a .js file'
  );

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

  const modulesByAbsolutePath = !extractStylesOptions.modulesByAbsolutePath
    ? undefined
    : Object.fromEntries(
        Object.entries(extractStylesOptions.modulesByAbsolutePath).map(
          ([key, value]) => [key.replace(extensionRegex, ''), value] as const
        )
      );

  const sourceDir = path.dirname(sourceFileName);
  let cssMap: Record<string, string> = {};
  const onInsertRule = (rule: string, key: string) => {
    cssMap[rule] = key;
  };

  const cssMode = options.cssMode;
  if (typeof cssMode !== 'undefined') {
    invariant(
      validCssModes.includes(cssMode),
      '`cssMode` is expected to be one of the following: %s',
      validCssModes.join(', ')
    );
  }

  const parserPlugins = options.parserPlugins?.slice() || [];
  if (/\.tsx?$/.test(sourceFileName)) {
    parserPlugins.push('typescript');
  } else {
    // TODO: is this a bad idea
    parserPlugins.push('flow');
  }

  const ast = parse(src, parserPlugins);

  const validComponents: Record<string, string> = {};

  let matchMediaImportName: string | undefined;
  let customPropertiesImportName: string | undefined;
  let cssFunctionImportName: string | undefined;

  // Find jsxstyle require in program root
  const jsxstyleSrc = ast.program.body.reduce<null | string>((prev, item) => {
    if (
      !t.isImportDeclaration(item) ||
      // not imported from jsxstyle? byeeee
      !JSXSTYLE_SOURCES.hasOwnProperty(item.source.value)
    ) {
      return prev;
    }

    if (prev) {
      invariant(
        prev === item.source.value,
        'Expected duplicate `import` to be from "%s", received "%s"',
        prev,
        item.source.value
      );
    }

    for (const specifier of item.specifiers) {
      if (
        !t.isImportSpecifier(specifier) ||
        !t.isIdentifier(specifier.imported) ||
        !t.isIdentifier(specifier.local)
      ) {
        continue;
      }

      if (specifier.imported.name === matchMediaHookName) {
        matchMediaImportName = specifier.local.name;
        continue;
      }

      if (specifier.imported.name === customPropertiesFunctionName) {
        customPropertiesImportName = specifier.local.name;
        continue;
      }

      if (specifier.imported.name === cssFunctionName) {
        cssFunctionImportName = specifier.local.name;
        continue;
      }

      if (componentStyles.hasOwnProperty(specifier.imported.name)) {
        validComponents[specifier.local.name] = specifier.imported.name;
        continue;
      }
    }

    return item.source.value;
  }, null);

  // jsxstyle isn't included anywhere, so let's bail
  if (jsxstyleSrc == null) {
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

  let cssFunction: CssFunction | undefined;
  if (cssFunctionImportName) {
    const getComponentProps: StyleCache['getComponentProps'] = (
      props,
      classPropName
    ) => processProps(props, classPropName, getClassNameForKey, onInsertRule);
    cssFunction = makeCssFunction(classPropName, getComponentProps);
  }

  // Generate a UID that's unique in the program scope
  let boxComponentName = '';
  traverse(ast, {
    Program(traversePath) {
      boxComponentName = generateUid(traversePath.scope, 'Box');
      traversePath.unshiftContainer(
        'body',
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
    },
  });

  /** A mapping of binding name to media query string */
  const mediaQueriesByKey: Record<string, string> = {};

  // per-file cache of evaluated bindings
  const bindingCache: Record<string, string | null> = {};

  if (
    matchMediaImportName ||
    customPropertiesImportName ||
    cssFunctionImportName
  ) {
    const callExpressionTraverseOptions: TraverseOptions<any> = {
      CallExpression(traversePath) {
        const { node } = traversePath;
        if (!t.isIdentifier(node.callee)) return;

        if (node.callee.name === matchMediaImportName) {
          if (node.arguments.length !== 1) {
            logError(
              '`%s` function call has the wrong number of parameters',
              matchMediaImportName
            );
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
        } else if (
          // makeCustomProperties
          node.callee.name === customPropertiesImportName
        ) {
          if (node.arguments.length !== 1) {
            logError(
              '`%s` import has the wrong number of parameters',
              customPropertiesImportName
            );
            return;
          }

          const attemptEval = !evaluateVars
            ? evaluateAstNode
            : getEvaluateAstNodeWithScopeFunction(
                traversePath,
                modulesByAbsolutePath,
                sourceFileName,
                bindingCache
              );

          const variantMap: VariantMap<string, string> = {
            default: attemptEval(node.arguments[0]),
          };

          let parentPath: NodePath | null = traversePath.parentPath;
          while (parentPath) {
            if (parentPath.node.type !== 'MemberExpression') {
              logError(
                'Expected a MemberExpression, received `%s`:',
                parentPath.node.type,
                generate(parentPath.node).code
              );
              break;
            }
            const prop = parentPath.node.property;
            if (prop.type !== 'Identifier') {
              logError(
                'Expected an Identified, received `%s`:',
                prop.type,
                generate(prop).code
              );
              break;
            }

            const grandparentPath: NodePath | null = parentPath.parentPath;
            if (!grandparentPath) {
              logError('Missing parentPath');
              break;
            }

            if (grandparentPath.node.type !== 'CallExpression') {
              logError(
                'Expected a CallExpression, received `%s`',
                generate(grandparentPath.node).code
              );
              break;
            }

            if (!grandparentPath.parentPath) {
              logError('Expected a parentPath');
              break;
            }
            parentPath = grandparentPath.parentPath;

            if (prop.name === 'addVariant') {
              if (grandparentPath.node.arguments.length !== 2) {
                logError('Expected two arguments');
                break;
              }

              const key = evaluateAstNode(grandparentPath.node.arguments[0]);
              const props = evaluateAstNode(grandparentPath.node.arguments[1]);
              variantMap[key] = props;
              continue;
            }

            if (prop.name === 'build') {
              const buildOptions =
                evaluateAstNode(grandparentPath.node.arguments[0]) || {};

              const result = generateCustomPropertiesFromVariants(
                variantMap,
                buildOptions
              );

              // order is important here
              for (let i = 0, len = result.styles.length; i < len; i++) {
                const sortKey = (i + '').padStart((len + '').length, '0');
                cssMap[`/*${sortKey}*/ ` + result.styles[i]] = '';
              }

              const wipFunction = t.functionExpression(
                null,
                [],
                t.blockStatement([
                  t.throwStatement(
                    t.newExpression(t.identifier('Error'), [
                      t.stringLiteral('Not yet implemented'),
                    ])
                  ),
                ])
              );

              grandparentPath.replaceWith(
                t.objectExpression([
                  ...Object.entries(result.customProperties).map(
                    ([propName, propValue]) => {
                      return t.objectProperty(
                        t.identifier(propName),
                        t.stringLiteral(propValue)
                      );
                    }
                  ),
                  t.objectProperty(
                    t.identifier('variants'),
                    t.arrayExpression(
                      result.variantNames.map((name) => t.stringLiteral(name))
                    )
                  ),
                  t.objectProperty(t.identifier('setVariant'), wipFunction),
                  ...result.variantNames.map((name) => {
                    return t.objectProperty(
                      t.identifier(
                        `activate${name[0].toUpperCase()}${name.slice(1)}`
                      ),
                      wipFunction
                    );
                  }),
                  // reset is a noop
                  t.objectProperty(
                    t.identifier('reset'),
                    t.functionExpression(null, [], t.blockStatement([]))
                  ),
                ])
              );

              break;
            }

            logError('Unhandled prop: %s', prop.name);
          }
        } else if (node.callee.name === cssFunctionImportName && cssFunction) {
          if (node.arguments.length !== 1) {
            logError(
              '`%s` import has the wrong number of parameters',
              cssFunctionImportName
            );
            return;
          }

          try {
            const arg = node.arguments[0];
            const attemptEval = !evaluateVars
              ? evaluateAstNode
              : getEvaluateAstNodeWithScopeFunction(
                  traversePath,
                  modulesByAbsolutePath,
                  sourceFileName,
                  bindingCache
                );
            const cssFunctionParam = attemptEval(arg);
            const className = cssFunction(cssFunctionParam) || '';
            if (
              traversePath.parentPath.node.type === 'JSXExpressionContainer'
            ) {
              traversePath.parentPath.replaceWith(t.stringLiteral(className));
            } else {
              traversePath.replaceWith(t.stringLiteral(className));
            }
          } catch (error) {
            // preserve the css function call
          }
        }
      },
    };

    traverse(ast, callExpressionTraverseOptions);
  }

  const jsxTraverseOptions: TraverseOptions<t.JSXElement> = {
    Program: {
      exit(programPath) {
        // update reference count for the code we modified
        programPath.scope.crawl();

        for (const binding of Object.values(programPath.scope.bindings)) {
          const { node, parentPath } = binding.path;
          if (
            node.type === 'ImportSpecifier' &&
            parentPath?.node.type === 'ImportDeclaration' &&
            parentPath.node.source.value === jsxstyleSrc
          ) {
            if (binding.references > 0) {
              if (
                noRuntimeMode &&
                node.imported.type === 'Identifier' &&
                // component import
                (componentStyles.hasOwnProperty(node.imported.name) ||
                  // or `css` function import
                  (!!cssFunctionImportName &&
                    node.imported.name === cssFunctionImportName))
              ) {
                for (const refPath of binding.referencePaths) {
                  logError(
                    'Runtime jsxstyle could not be completely removed:\n%s',
                    refPath.node.loc
                      ? codeFrameColumns(generate(ast).code, refPath.node.loc)
                      : generate(refPath.node).code
                  );
                }
              }
            } else {
              binding.path.remove();
              // remove empty imports
              if (parentPath.node.specifiers.length === 0) {
                parentPath.remove();
              }
            }
          }
        }
      },
    },

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
          : getEvaluateAstNodeWithScopeFunction(
              traversePath,
              modulesByAbsolutePath,
              sourceFileName,
              bindingCache
            );

        let lastSpreadIndex = -1;
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

          // certain props are passed directly on to the underlying component
          if (
            name.startsWith('on') ||
            commonComponentProps.hasOwnProperty(name)
          ) {
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

          if (name === 'props') {
            if (t.isObjectExpression(value)) {
              let errorCount = 0;
              const attributes: Array<t.JSXAttribute | t.JSXSpreadAttribute> =
                [];

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
                    staticAttributes[name] = null;

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

          let componentPropIndex = -1;
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

          for (const mediaQuery of mediaQueries) {
            const mediaQueryStyles = {
              ...staticAttributesByMediaQuery[mediaQuery],
              [classPropName]: staticAttributes[classPropName],
            };

            const processedProps = processProps(
              mediaQueryStyles,
              classPropName,
              getClassNameForKey,
              onInsertRule,
              mediaQuery
            );

            if (!processedProps) {
              continue;
            }

            if (processedProps[classPropName]) {
              staticAttributes[classPropName] = processedProps[classPropName];
            }
          }
        }

        const processedProps = processProps(
          staticAttributes,
          classPropName,
          getClassNameForKey,
          onInsertRule
        );

        const extractedStyleClassNames = processedProps?.[classPropName];
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
          const ternaryExpression = extractStaticTernaries(
            staticTernaries,
            getClassNameForKey,
            onInsertRule
          );

          // ternaryExpression is null if all of the extracted ternaries have falsey consequents and alternates
          if (ternaryExpression !== null) {
            classNameObjects.push(ternaryExpression);
          }
        }

        if (typeof extractedStyleClassNames === 'string') {
          classNameObjects.push(t.stringLiteral(extractedStyleClassNames));
        }

        const classNamePropValueForReals =
          classNameObjects.reduce<t.Expression | null>((acc, val) => {
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
          }, null);

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
            let statementPath: NodePath<any> | null | undefined = traversePath;
            do {
              statementPath = statementPath?.parentPath;
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

        if (cssMode === 'styled-jsx') {
          if (!t.isJSXElement(traversePath.parentPath)) {
            const cssContent = Object.keys(cssMap).join(' ');
            cssMap = {};

            if (cssContent !== '') {
              // TODO(meyer) wrap `traversePath.node` in a fragment
              invariant(
                traversePath.node.closingElement,
                'Encountered a self-closing jsxstyle element. Style injection will be skipped.'
              );

              const styleTag = t.jsxElement(
                t.jsxOpeningElement(t.jsxIdentifier('style'), [
                  t.jsxAttribute(t.jsxIdentifier('jsx'), null),
                  t.jsxAttribute(t.jsxIdentifier('global'), null),
                ]),
                t.jsxClosingElement(t.jsxIdentifier('style')),
                [
                  t.jsxExpressionContainer(
                    t.templateLiteral(
                      [t.templateElement({ raw: cssContent })],
                      []
                    )
                  ),
                ],
                false
              );

              traversePath.node.children.push(styleTag);
              traversePath.skip();
            }
          }
        }
      },
    },
  };
  traverse(ast, jsxTraverseOptions);

  // path.parse doesn't exist in the webpack'd bundle but path.dirname and path.basename do.
  const extName = path.extname(sourceFileName);
  const baseName = path.basename(sourceFileName, extName);
  const cssRelativeFileName = `./${baseName}__jsxstyle.css`;
  const cssFileName = path.join(sourceDir, cssRelativeFileName);

  let resultCSS = '';

  const cssMapEntries = Object.entries(cssMap);
  if (cssMapEntries.length > 0) {
    const importsToPrepend: t.Statement[] = [];
    if (!cssMode || cssMode === 'singleInlineImport') {
      const relativeFilePath = path.relative(process.cwd(), sourceFileName);

      const cssString =
        `/* ${relativeFilePath} */\n` +
        cssMapEntries
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([cssRule]) => cssRule + '\n')
          .join('');

      if (cssMode === 'singleInlineImport') {
        importsToPrepend.push(
          getImportForSource(getInlineImportString(resultCSS, relativeFilePath))
        );
      } else {
        resultCSS = cssString;
        importsToPrepend.push(getImportForSource(cssRelativeFileName));
      }
    } else if (cssMode === 'multipleInlineImports') {
      Object.entries(cssMap).forEach(([cssRule, key]) => {
        if (cssRule !== '') {
          const importNode = getImportForSource(
            getInlineImportString(cssRule, key)
          );
          cssRule.split('\n').forEach((line) => {
            t.addComment(importNode, 'leading', ' ' + line, true);
          });
          importsToPrepend.push(importNode);
        }
      });
    }
    ast.program.body.unshift(...importsToPrepend);
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
