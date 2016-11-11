'use strict';

var Flex = require('../Flex');

var curry = require('../curry');

var Addons = {
  Row: curry(Flex, {flexDirection: 'row'}),
  Col: curry(Flex, {flexDirection: 'column'}),
};

Addons.Row.displayName = 'Row';
Addons.Col.displayName = 'Col';

module.exports = Addons;
