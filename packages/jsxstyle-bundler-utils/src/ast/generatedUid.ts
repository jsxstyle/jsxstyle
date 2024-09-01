import * as t from '@babel/types';
import invariant from 'invariant';

/** A clone of `path.scope.generateUid` that doesn't prepend underscores */
export function generateUid(scope: any, name: string): string {
  invariant(
    scope != null,
    'generateUid expects a scope object as its first parameter'
  );
  invariant(
    typeof name === 'string' && name !== '',
    'generateUid expects a valid name as its second parameter'
  );

  const formattedName = t
    .toIdentifier(name)
    .replace(/^_+/, '')
    .replace(/[0-9]+$/g, '');

  let uid: string;
  let i = 0;
  do {
    if (i > 1) {
      uid = formattedName + i;
    } else {
      uid = formattedName;
    }
    i++;
  } while (
    scope.hasLabel(uid) ||
    scope.hasBinding(uid) ||
    scope.hasGlobal(uid) ||
    scope.hasReference(uid)
  );

  const program = scope.getProgramParent();
  program.references[uid] = true;
  program.uids[uid] = true;

  return uid;
}
