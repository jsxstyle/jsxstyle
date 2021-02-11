// @ts-check

/** @typedef {{ opts: { functionNames?: string[] } }} PluginState */

/**
 * Prepend PURE annotations to function calls
 *
 * @type {(babel: import('@babel/core')) => import('@babel/core').PluginObj<PluginState>}
 */
module.exports = ({ types: t }) => ({
  name: 'babel-plugin-pure-annotation',
  visitor: {
    CallExpression(path, state) {
      if (
        t.isIdentifier(path.node.callee) &&
        Array.isArray(state.opts.functionNames) &&
        state.opts.functionNames.includes(path.node.callee.name)
      ) {
        path.addComment('leading', '#__PURE__');
      }
    },
  },
});
