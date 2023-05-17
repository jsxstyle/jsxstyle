import * as t from '@babel/types';

export const getImportForSource = (importString: string): t.Statement =>
  t.importDeclaration([], t.stringLiteral(importString));
