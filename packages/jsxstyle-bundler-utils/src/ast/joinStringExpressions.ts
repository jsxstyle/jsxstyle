import * as t from '@babel/types';

/** split BinaryExpressions joined by a plus into an array of expressions */
const splitBinaryExpression = (node: t.Expression): t.Expression[] => {
  if (
    node.type !== 'BinaryExpression' ||
    node.operator !== '+' ||
    node.left.type === 'PrivateName'
  ) {
    return [node];
  }
  return [
    ...splitBinaryExpression(node.left),
    ...splitBinaryExpression(node.right),
  ];
};

export const joinStringExpressions = (
  ...args: Array<t.Expression | null>
): t.BinaryExpression | t.StringLiteral => {
  return (
    args
      // filter out all empty strings and nullish values
      .filter((item): item is t.Expression => {
        return (
          !!item &&
          item.type !== 'NullLiteral' &&
          !(item.type === 'StringLiteral' && item.value === '') &&
          !(item.type === 'Identifier' && item.name === 'undefined') &&
          !(item.type === 'BooleanLiteral' && item.value === false)
        );
      })
      .sort((a, b) => {
        if (a.type === 'StringLiteral' && b.type === 'StringLiteral') {
          return a.value.localeCompare(b.value);
        }
        // sort string literals to the front
        if (a.type === 'StringLiteral') return -1;
        if (b.type === 'StringLiteral') return 1;
        return 0;
      })
      .reduce<t.Expression[]>((p, c, index) => {
        // join each expression together with a space in between
        if (index !== 0) {
          p.push(t.stringLiteral(' '));
        }
        // break down any potential BinaryExpressions
        p.push(...splitBinaryExpression(c));
        return p;
      }, [])
      // glue everything together
      .reduce<t.BinaryExpression | t.StringLiteral>(
        (a, b) => {
          if (a.type === 'StringLiteral' && b.type === 'StringLiteral') {
            return t.stringLiteral(a.value + b.value);
          }
          if (
            a.type === 'StringLiteral' &&
            b.type === 'BinaryExpression' &&
            b.left.type === 'StringLiteral'
          ) {
            return { ...b, left: t.stringLiteral(a.value + b.left.value) };
          }
          if (
            a.type === 'BinaryExpression' &&
            a.right.type === 'StringLiteral' &&
            b.type === 'StringLiteral'
          ) {
            return { ...a, right: t.stringLiteral(a.right.value + b.value) };
          }
          return t.binaryExpression('+', a, b);
        },
        // always start with an empty StringLiteral in order to coerce the output to a string
        t.stringLiteral('')
      )
  );
};
