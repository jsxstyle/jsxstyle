import * as path from 'node:path';
import type { ParserPlugin } from '@babel/parser';
import type { NodePath, TraverseOptions } from '@babel/traverse';
import * as t from '@babel/types';
import { VISITOR_KEYS } from '@babel/types';
import { componentStyles } from '@jsxstyle/core';
import type { CustomPropsObject, GetClassNameForKeyFn } from '@jsxstyle/core';
import {
  type VariantMap,
  generateCustomPropertiesFromVariants,
} from '@jsxstyle/core';
import invariant from 'invariant';
import { parse } from './babelUtils.js';
import { generate, traverse } from './babelUtils.js';
import { evaluateAstNode } from './evaluateAstNode.js';
import { generateUid } from './generatedUid.js';
import { getEvaluateAstNodeWithScopeFunction } from './getEvaluateAstNodeWithScopeFunction.js';
import { getImportForSource } from './getImportForSource.js';
import { getInlineImportString } from './getInlineImportString.js';
import { extensionRegex } from './getStaticBindingsForScope.js';
import { handleCssFunction } from './handleCssFunction.js';
import { handleJsxElement } from './handleJsxAttributes.js';
import { getCustomPropsAstNode } from './getCustomPropsAstNode.js';

function skipChildren(path: NodePath) {
  const keys = VISITOR_KEYS[path.type];
  if (!keys) return;
  for (const key of keys) {
    path.skipKey(key);
  }
}

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

export interface OptionsObject {
  attemptEval: (exprNode: t.Node) => any;
  classPropName: string;
  getClassNameForKey: GetClassNameForKeyFn;
  logError: (str: string, ...args: any[]) => void;
  logWarning: (str: string, ...args: any[]) => void;
  mediaQueriesByKey: Record<string, string>;
  noRuntime: boolean;
  onInsertRule: (rule: string, key: string) => void;
}

declare module '@babel/traverse' {
  export interface NodePath {
    _complexComponentProp?: t.VariableDeclarator[] | null;
  }
}

const JSXSTYLE_SOURCES = {
  '@jsxstyle/react': true,
  '@jsxstyle/preact': true,
  '@jsxstyle/solid': true,
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
        invariant(
          false,
          'Unhandled type `%s` for `%s` component styles',
          typeof propValue,
          componentName
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
      CallExpression: {
        exit(traversePath) {
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
            if (node.arguments.length < 1 || node.arguments.length > 2) {
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

            const variantMap: VariantMap<string, CustomPropsObject> = {
              default: {
                props: node.arguments[0]
                  ? attemptEval(node.arguments[0])
                  : null,
                options: node.arguments[1]
                  ? attemptEval(node.arguments[1])
                  : undefined,
              },
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
                if (
                  grandparentPath.node.arguments.length < 2 ||
                  grandparentPath.node.arguments.length > 3
                ) {
                  logError('Expected two arguments');
                  break;
                }

                const [keyNode, propsNode, optionsNode] =
                  grandparentPath.node.arguments;

                if (!keyNode || !propsNode) {
                  // TODO(meyer) log error?
                  continue;
                }
                const key = evaluateAstNode(keyNode);
                const props = evaluateAstNode(propsNode);
                const options = optionsNode
                  ? evaluateAstNode(optionsNode)
                  : undefined;
                variantMap[key] = { props, options };
                continue;
              }

              if (prop.name === 'build') {
                const optionsNode = grandparentPath.node.arguments[0];
                const buildOptions =
                  (optionsNode && evaluateAstNode(optionsNode)) || {};

                const result = generateCustomPropertiesFromVariants(
                  variantMap,
                  buildOptions
                );

                // order is important here
                for (const style of result.styles) {
                  cssMap[style] = '';
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
                    ...getCustomPropsAstNode(result.customProperties),
                    t.objectProperty(
                      t.identifier('variantNames'),
                      t.arrayExpression(
                        result.variantNames.map((name) => t.stringLiteral(name))
                      )
                    ),
                    t.objectProperty(t.identifier('setVariant'), wipFunction),
                    t.objectProperty(
                      t.identifier('variants'),
                      t.objectExpression(
                        result.variantNames.map((name) => {
                          return t.objectProperty(
                            t.identifier(name),
                            t.objectExpression([
                              t.objectProperty(
                                t.identifier('className'),
                                t.stringLiteral(
                                  // biome-ignore lint/style/noNonNullAssertion: variant name is always present in variants object
                                  result.variants[name]!.className
                                )
                              ),
                              t.objectProperty(
                                t.identifier('activate'),
                                wipFunction
                              ),
                            ])
                          );
                        })
                      )
                    ),
                  ])
                );

                break;
              }

              logError('Unhandled prop: %s', prop.name);
            }
          } else if (node.callee.name === cssFunctionImportName) {
            try {
              const attemptEval = !evaluateVars
                ? evaluateAstNode
                : getEvaluateAstNodeWithScopeFunction(
                    traversePath,
                    modulesByAbsolutePath,
                    sourceFileName,
                    bindingCache
                  );

              const newCssFunctionNode = handleCssFunction(node, {
                attemptEval,
                classPropName,
                mediaQueriesByKey,
                getClassNameForKey,
                onInsertRule,
                logError,
                logWarning,
                noRuntime: !!noRuntimeMode,
              });

              if (
                traversePath.parentPath.node.type === 'JSXExpressionContainer'
              ) {
                traversePath.parentPath.replaceWith(newCssFunctionNode);
              } else {
                traversePath.replaceWith(newCssFunctionNode);
              }
              skipChildren(traversePath);
            } catch (error) {
              // preserve the css function call
            }
          }
        },
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
                    generate(refPath.node).code
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
        const { openingElement } = traversePath.node;

        if (
          // skip non-identifier opening elements (member expressions, etc.)
          !t.isJSXIdentifier(openingElement.name) ||
          // skip non-jsxstyle components
          !validComponents.hasOwnProperty(openingElement.name.name)
        ) {
          return;
        }

        // Remember the source component
        const originalNodeName = openingElement.name.name;
        const srcKey = validComponents[originalNodeName];
        const initialStyles = (srcKey && defaultStyleAttributes[srcKey]) || [];

        const attemptEval = !evaluateVars
          ? evaluateAstNode
          : getEvaluateAstNodeWithScopeFunction(
              traversePath,
              modulesByAbsolutePath,
              sourceFileName,
              bindingCache
            );

        try {
          const updatedElement = handleJsxElement(
            traversePath.node,
            initialStyles,
            boxComponentName,
            {
              attemptEval,
              classPropName,
              mediaQueriesByKey,
              getClassNameForKey,
              onInsertRule,
              logError,
              logWarning,
              noRuntime: !!noRuntimeMode,
            }
          );
          traversePath.replaceWith(updatedElement);
        } catch (error) {
          //
        }
      },
      exit(traversePath) {
        if (cssMode === 'styled-jsx') {
          if (traversePath.parentPath.type !== 'JSXElement') {
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
      const relativeFilePath =
        typeof process === 'undefined'
          ? sourceFileName
          : path.relative(process.cwd(), sourceFileName);

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
      for (const [cssRule, key] of Object.entries(cssMap)) {
        if (cssRule !== '') {
          const importNode = getImportForSource(
            getInlineImportString(cssRule, key)
          );
          for (const line of cssRule.split('\n')) {
            t.addComment(importNode, 'leading', ' ' + line, true);
          }
          importsToPrepend.push(importNode);
        }
      }
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
