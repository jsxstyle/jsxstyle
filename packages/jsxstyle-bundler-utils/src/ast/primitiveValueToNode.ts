import * as t from '@babel/types';

// identifiers cannot start with a number
const identifierRegex = /^[a-z_][a-z0-9_]+$/i;

export const primitiveValueToNode = (value: unknown): t.Expression => {
  if (value === null) {
    return t.nullLiteral();
  } else if (typeof value === 'object') {
    return t.objectExpression(
      Object.entries(value).map(([key, value]) => {
        const canBeIdentifier = identifierRegex.test(key);
        const keyNode = canBeIdentifier
          ? t.identifier(key)
          : t.stringLiteral(key);
        return t.objectProperty(keyNode, primitiveValueToNode(value));
      })
    );
  } else if (typeof value === 'number') {
    return t.numericLiteral(value);
  } else if (typeof value === 'string') {
    return t.stringLiteral(value);
  } else if (typeof value === 'undefined') {
    return t.identifier('undefined');
  }
  throw new Error('Unhandled value type: ' + typeof value);
};
