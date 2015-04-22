'use strict';

var Color = require('./lib/Color');
var Display = require('./lib/Display');

var assign = require('object-assign');

var index = assign({}, Color, Display);

module.exports = index;
