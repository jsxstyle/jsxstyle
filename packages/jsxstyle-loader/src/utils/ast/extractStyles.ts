import Ajv = require('ajv');
import invariant = require('invariant');
import path = require('path');
import util = require('util');
import vm = require('vm');
import generate from '@babel/generator';
import traverse, { VisitNodeObject } from '@babel/traverse';
import t = require('@babel/types');
import {
  getStyleKeysForProps,
  componentStyles,
  CSSProperties,
} from 'jsxstyle-utils';

import evaluateAstNode from './evaluateAstNode';
import extractStaticTernaries from './extractStaticTernaries';
import generateUid from './generatedUid';
import getPropValueFromAttributes from './getPropValueFromAttributes';
import getStaticBindingsForScope from './getStaticBindingsForScope';
import getStylesByClassName from '../getStylesByClassName';
import parse from './parse';
import {
  StyleProps,
  CacheObject,
  BabylonPlugin,
  StaticTernary,
} from '../../types';

const loaderSchema = require('../../../schema/loader.json');

export interface ExtractStylesOptions {
  classNameFormat?: 'hash';
  liteMode?: boolean;
  namedStyleGroups?: {
    [key: string]: CSSProperties;
  };
  parserPlugins?: BabylonPlugin[]; // TODO: replace with babylon.PluginName
  styleGroups?: StyleProps[];
  whitelistedModules?: string[];
  cssModules?: boolean;
  evaluateVars?: boolean;
}

export interface Options {
  cacheObject: CacheObject;
  errorCallback: (...args: any[]) => void;
  warnCallback: (...args: any[]) => void;
}

export interface BabelTraverseScope {}

interface TraversePath<TNode = any> {
  node: TNode;
  scope: BabelTraverseScope;
  _complexComponentProp?: any; //t.VariableDeclarator;
  parentPath: TraversePath<any>;
  insertBefore: (arg: t.Node) => void;
}

// props that will be passed through as-is
const UNTOUCHED_PROPS = {
  key: true,
  style: true,
};

// props that cannot appear in the props prop (so meta)
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

  const propKeys: string[] = Object.keys(styleObj);
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

export default function extractStyles(
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

  invariant(
    typeof cacheObject === 'object' && cacheObject !== null,
    '`cacheObject` must be an object'
  );

  if (typeof warnCallback !== 'undefined') {
    invariant(
      typeof warnCallback === 'function',
      '`warnCallback` is expected to be a function'
    );
  } else {
    warnCallback = console.warn;
  }

  if (typeof errorCallback !== 'undefined') {
    invariant(
      typeof errorCallback === 'function',
      '`errorCallback` is expected to be a function'
    );
  } else {
    errorCallback = console.error;
  }

  const ajv = new Ajv({
    allErrors: true,
    useDefaults: true,
    errorDataPath: 'property',
  });

  if (!ajv.validate(loaderSchema, options)) {
    const msg =
      'jsxstyle-loader is incorrectly configured:\n' +
      (ajv.errors || [])
        .map(err => util.format(' - options%s %s', err.dataPath, err.message))
        .join('\n');
    errorCallback(msg);
    throw new Error(msg);
  }

  const {
    classNameFormat,
    liteMode,
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
  ast.program.body = ast.program.body.filter((item: t.Node) => {
    if (t.isVariableDeclaration(item)) {
      item.declarations = item.declarations.filter(dec => {
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
          dec.init.arguments.length !== 1 ||
          !t.isStringLiteral(dec.init.arguments[0])
        ) {
          return true;
        }

        const firstArg = dec.init.arguments[0];
        if (!t.isStringLiteral(firstArg)) {
          return;
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

          jsxstyleSrc = firstArg.value;
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
  if (jsxstyleSrc == null || !hasValidComponents) {
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
  let boxComponentName: string | undefined;
  traverse(ast, {
    Program(path: TraversePath) {
      boxComponentName = generateUid(path.scope, 'Box');
    },
  });

  // per-file cache of evaluated bindings
  const bindingCache = {};

  const traverseOptions: { JSXElement: VisitNodeObject<t.JSXElement> } = {
    JSXElement: {
      enter(path: TraversePath<t.JSXElement>) {
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

        node.name.name = boxComponentName!;

        // prepend initial styles
        const initialStyles = defaultStyleAttributes[src];
        if (initialStyles) {
          node.attributes = [...initialStyles, ...node.attributes];
        }

        const attemptEval = !evaluateVars
          ? evaluateAstNode
          : (function() {
              // Generate scope object at this level
              const staticNamespace = getStaticBindingsForScope(
                path.scope,
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
        const flattenedAttributes: (
          | t.JSXAttribute
          | t.JSXSpreadAttribute)[] = [];
        node.attributes.forEach(attr => {
          if (t.isJSXSpreadAttribute(attr)) {
            try {
              const spreadValue = attemptEval(attr.argument);

              if (typeof spreadValue !== 'object' || spreadValue == null) {
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

        let propsAttributes: (t.JSXSpreadAttribute | t.JSXAttribute)[] = [];
        const staticAttributes: { [key: string]: any } = {};
        let inlinePropCount = 0;

        const staticTernaries: StaticTernary[] = [];

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
            warnCallback('`%s` prop does not have a value', name);
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
            warnCallback(
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
              const attributes: (t.JSXAttribute | t.JSXSpreadAttribute)[] = [];

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
                      warnCallback(
                        '`props` prop contains an invalid key: `%s`',
                        propObj.key.value
                      );
                      errorCount++;
                      continue;
                    }
                  } else {
                    warnCallback(
                      'unhandled object property key type: `%s`',
                      propObj.type
                    );
                    errorCount++;
                  }

                  if (!key) continue;

                  if (ALL_SPECIAL_PROPS.hasOwnProperty(key)) {
                    warnCallback(
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
                  warnCallback(
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
            warnCallback('props prop is an unhandled type: `%s`', value.type);
            inlinePropCount++;
            return true;
          }

          if (name === 'mediaQueries') {
            try {
              staticAttributes[name] = attemptEval(value);
              return false;
            } catch (e) {
              warnCallback(
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

              staticTernaries.push({
                name,
                test: value.test,
                consequent,
                alternate,
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
                staticTernaries.push({
                  name,
                  test: value.left,
                  consequent,
                  alternate: null,
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

        let classNamePropValue;
        const classNamePropIndex = node.attributes.findIndex(
          attr =>
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
            attr =>
              !t.isJSXSpreadAttribute(attr) &&
              attr.name &&
              attr.name.name === 'props'
          );
          // deal with props prop
          if (propsPropIndex > -1) {
            if (propsAttributes.length > 0) {
              propsAttributes.forEach(a => node.attributes.push(a));
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
              warnCallback(
                'Complex `component` prop value (`%s`) will be extracted out as a separate variable declaration.',
                generate(componentPropValue).code
              );
              node.name.name = generateUid(path.scope, 'Component');
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
          if (lastSpreadIndex > -1) {
            // if only some style props were extracted AND additional props are spread onto the component,
            // add the props back with null values to prevent spread props from incorrectly overwriting the extracted prop value
            Object.keys(staticAttributes).forEach(attr => {
              node.attributes.push(
                t.jsxAttribute(
                  t.jsxIdentifier(attr),
                  t.jsxExpressionContainer(t.nullLiteral())
                )
              );
            });
          }
        }

        if (path.node.closingElement) {
          // this seems strange
          if (t.isJSXMemberExpression(path.node.closingElement.name)) {
            warnCallback('Closing element is a member expression');
            return;
          }
          path.node.closingElement.name.name = node.name.name;
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

        const classNameObjects: (t.StringLiteral | t.Expression)[] = [];

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
            if (styleObjects == null) continue;
            delete styleObjects.classNameKey;
            const styleObjectKeys = Object.keys(styleObjects).sort();

            for (let idx = -1, len = styleObjectKeys.length; ++idx < len; ) {
              const k = styleObjectKeys[idx];
              const item = styleObjects[k];
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

            cssMap.set(className, { css, commentTexts: [comment] });
          }
        }
      },
      exit(path: TraversePath<t.JSXElement>) {
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
  };
  traverse(ast, traverseOptions);

  const css = Array.from(cssMap.values())
    .map(n => n.commentTexts.map(t => `${t}\n`).join('') + n.css)
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
              t.identifier(boxComponentName!),
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
            t.identifier(boxComponentName!),
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
      filename: sourceFileName,
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
    ast,
    map: result.map,
  };
}
