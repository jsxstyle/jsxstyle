import * as t from '@babel/types';

export const getImportForSource = (
  importString: string,
  useImportSyntax: boolean
): t.Statement => {
  if (useImportSyntax) {
    return t.importDeclaration([], t.stringLiteral(importString));
  } else {
    return t.expressionStatement(
      t.callExpression(t.identifier('require'), [t.stringLiteral(importString)])
    );
  }
};
