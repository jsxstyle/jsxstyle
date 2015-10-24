'use strict';

var Flex = require('../Flex');

var curry = require('../curry');

var Addons = {
  Row: curry(Flex, {flexDirection: 'row'}),
  Col: curry(Flex, {flexDirection: 'column'}),
};

module.exports = Addons;
