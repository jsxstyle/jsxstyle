import { extractStyles } from 'jsxstyle/private/extract-styles';
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
      return () => 'x' + (++index).toString(36);
    })(),
  });

  babelTraverse(ast, {
    ExportDefaultDeclaration: (path) => {
      const dec = path.node.declaration;
      let exportedExpression: t.Expression;
      if (dec.type === 'ClassDeclaration') {
        exportedExpression = { ...dec, type: 'ClassExpression' };
      } else if (dec.type === 'FunctionDeclaration') {
        exportedExpression = { ...dec, type: 'FunctionExpression' };
      } else if (dec.type === 'Identifier') {
        exportedExpression = dec;
      } else {
        throw new Error('Unsupported declaration type: ' + dec.type);
      }

      path.replaceWith(
        t.assignmentExpression(
          '=',
          t.memberExpression(t.identifier('exports'), t.identifier('default')),
          exportedExpression
        )
      );
    },

    ExportNamedDeclaration: (path) => {
      const dec = path.node.declaration;
      if (!dec) {
        throw new Error('Missing declaration');
      }

      if (dec.type === 'VariableDeclaration') {
        path.replaceWithMultiple(
          dec.declarations.map((declarator) => {
            if (!declarator.init) {
              throw new Error('An exported variable declaration needs a value');
            }
            if (declarator.id.type !== 'Identifier') {
              throw new Error('');
            }
            return t.assignmentExpression(
              '=',
              t.memberExpression(
                t.identifier('exports'),
                t.stringLiteral(declarator.id.name),
                true
              ),
              declarator.init
            );
          })
        );
        return;
      }
    },

    ExportAllDeclaration: () => {
      throw new Error('Only named and default exports are supported');
    },

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
