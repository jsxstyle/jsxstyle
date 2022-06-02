import { extractStyles } from 'jsxstyle-webpack-plugin/lib/utils/ast/extractStyles';
import babelTraverse from '@babel/traverse';
import generate from '@babel/generator';
import * as t from '@babel/types';

const convertMemberExpression = (
  expression: t.JSXMemberExpression
): t.MemberExpression => {
  return t.memberExpression(
    expression.object.type === 'JSXMemberExpression'
      ? convertMemberExpression(expression.object)
      : t.identifier(expression.object.name),
    t.identifier(expression.property.name)
  );
};

export const transpile = (code: string) => {
  const errors: unknown[] = [];
  const warnings: unknown[] = [];

  const { ast, css, cssFileName, js } = extractStyles(code, '/example.tsx', {
    warnCallback: (warning) => warnings.push(warning),
    errorCallback: (error) => errors.push(error),
    getClassNameForKey: (() => {
      let index = 0;
      return () => '_x' + (++index).toString(36);
    })(),
  });

  const unsupportedExport = () => {
    throw new Error('Only default exports are supported');
  };

  babelTraverse(ast, {
    ExportDefaultDeclaration(path) {
      if (
        path.node.declaration.type === 'ClassDeclaration' ||
        path.node.declaration.type === 'TSDeclareFunction' ||
        path.node.declaration.type === 'FunctionDeclaration'
      ) {
        throw new Error(
          'Unsupported export declaration type: ' + path.node.declaration.type
        );
      }

      path.replaceWith(
        t.assignmentExpression(
          '=',
          t.memberExpression(t.identifier('exports'), t.identifier('default')),
          path.node.declaration
        )
      );
    },

    ExportNamedDeclaration: unsupportedExport,
    ExportAllDeclaration: unsupportedExport,

    ImportDeclaration(path) {
      path.replaceWithMultiple(
        path.node.specifiers.map((specifier): t.VariableDeclaration => {
          const thing = t.callExpression(t.identifier('require'), [
            path.node.source,
          ]);

          if (specifier.type === 'ImportDefaultSpecifier') {
            return t.variableDeclaration('const', [
              t.variableDeclarator(
                t.objectPattern([
                  t.objectProperty(t.identifier('default'), specifier.local),
                ]),
                thing
              ),
            ]);
          } else if (specifier.type === 'ImportNamespaceSpecifier') {
            return t.variableDeclaration('const', [
              t.variableDeclarator(t.identifier(specifier.local.name), thing),
            ]);
          } else if (specifier.type === 'ImportSpecifier') {
            return t.variableDeclaration('const', [
              t.variableDeclarator(
                t.objectPattern([
                  t.objectProperty(specifier.imported, specifier.local),
                ]),
                thing
              ),
            ]);
          } else {
            throw new Error(
              'Unhandled specifier type: ' + (specifier as any).type
            );
          }
        })
      );
    },

    JSXFragment(path) {
      const reactFragment = t.jsxMemberExpression(
        t.jsxIdentifier('React'),
        t.jsxIdentifier('Fragment')
      );

      path.replaceWith(
        t.jsxElement(
          t.jsxOpeningElement(reactFragment, []),
          t.jsxClosingElement(reactFragment),
          path.node.children
        )
      );
    },

    JSXElement(path) {
      const elName = path.node.openingElement.name;
      let param1: t.Expression;
      if (elName.type === 'JSXIdentifier') {
        if (
          elName.name[0] === elName.name[0].toUpperCase() ||
          elName.name[0] === '_'
        ) {
          param1 = t.identifier(elName.name);
        } else {
          param1 = t.stringLiteral(elName.name);
        }
      } else if (elName.type === 'JSXMemberExpression') {
        param1 = convertMemberExpression(elName);
      } else {
        throw new Error(
          'Opening element of type ' + elName.type + ' is not supported'
        );
      }

      const hasStaticChildren = path.node.children.length > 0;

      const objectExpression = t.objectExpression(
        path.node.openingElement.attributes.reduce<
          Array<t.SpreadElement | t.ObjectProperty>
        >((prev, attr) => {
          if (attr.type === 'JSXSpreadAttribute') {
            prev.push(t.spreadElement(attr.argument));
          } else if (attr.type === 'JSXAttribute') {
            let name: string;
            if (attr.name.type === 'JSXIdentifier') {
              name = attr.name.name;
            } else {
              throw new Error(
                'Unhandled attribute name type: ' + attr.name.type
              );
            }

            if (name === 'children' && hasStaticChildren) {
              return prev;
            }

            let value: t.Expression;
            if (!attr.value) {
              value = t.booleanLiteral(true);
            } else if (attr.value.type === 'JSXExpressionContainer') {
              if (attr.value.expression.type === 'JSXEmptyExpression') {
                value = t.identifier('undefined');
              } else {
                value = attr.value.expression;
              }
            } else {
              value = attr.value;
            }

            prev.push(t.objectProperty(t.identifier(name), value));
          } else {
            throw new Error('Unhandled attribute type: ' + (attr as any).type);
          }

          return prev;
        }, [])
      );

      if (hasStaticChildren) {
        objectExpression.properties.push(
          t.objectProperty(
            t.identifier('children'),
            t.arrayExpression(
              path.node.children.map((child) => {
                if (child.type === 'JSXExpressionContainer') {
                  if (child.expression.type === 'JSXEmptyExpression') {
                    return t.nullLiteral();
                  }
                  return child.expression;
                } else if (child.type === 'JSXElement') {
                  return child;
                } else if (child.type === 'JSXText') {
                  return t.stringLiteral(child.value);
                } else {
                  throw new Error('Unhandled child type: ' + child.type);
                }
              })
            )
          )
        );
      }

      path.replaceWith(
        t.callExpression(t.identifier(hasStaticChildren ? 'jsxs' : 'jsx'), [
          param1,
          objectExpression,
        ])
      );
    },
  });

  ast.program.body.unshift(
    t.variableDeclaration('const', [
      t.variableDeclarator(
        t.objectPattern([
          t.objectProperty(t.identifier('jsx'), t.identifier('jsx')),
          t.objectProperty(t.identifier('jsxs'), t.identifier('jsxs')),
        ]),
        t.callExpression(t.identifier('require'), [
          t.stringLiteral('react/jsx-runtime'),
        ])
      ),
    ]),
    t.variableDeclaration('const', [
      t.variableDeclarator(
        t.identifier('React'),
        t.callExpression(t.identifier('require'), [t.stringLiteral('react')])
      ),
    ])
  );

  const browserFriendlyJs = generate(ast).code;

  return {
    css,
    cssFileName,
    js: js.toString('utf8'),
    browserFriendlyJs,
    warnings,
    errors,
  };
};
