'use strict';

const invariant = require('invariant');
const t = require('@babel/types');

// A clone of path.scope.generateUid that doesn't prepend underscores
function generateUid(scope, name) {
  invariant(
    typeof scope === 'object',
    'generateUid expects a scope object as its first parameter'
  );
  invariant(
    typeof name === 'string' && name !== '',
    'generateUid expects a valid name as its second parameter'
  );

  name = t
    .toIdentifier(name)
    .replace(/^_+/, '')
    .replace(/[0-9]+$/g, '');

  let uid;
  let i = 0;
  do {
    if (i > 1) {
      uid = name + i;
    } else {
      uid = name;
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

module.exports = generateUid;
