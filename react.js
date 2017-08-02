'use strict';

var makeStyleComponentClass = require('./lib/makeStyleComponentClass');
var getComponents = require('./lib/getComponents');

// prettier-ignore
module.exports = getComponents(makeStyleComponentClass);
