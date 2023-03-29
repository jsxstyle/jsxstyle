import type t from '@babel/types';
import util from 'util';
import path from 'path';

export const getCommentForNode = (
  node: t.Node,
  sourceFileName: string,
  context?: string
) => {
  const lineNumbers =
    node.loc &&
    node.loc.start.line +
      (node.loc.start.line !== node.loc.end.line
        ? `-${node.loc.end.line}`
        : '');

  const comment = util.format(
    '/* %s:%s%s */',
    path.relative(process.cwd(), sourceFileName),
    lineNumbers,
    context ? ` (${context})` : ''
  );

  return comment;
};
