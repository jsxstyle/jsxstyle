module.exports = require('babel-jest').createTransformer({
  presets: [
    // transform jsx
    'react',
    // transform imports
    ['env', { targets: { node: 'current' } }],
  ],
});
