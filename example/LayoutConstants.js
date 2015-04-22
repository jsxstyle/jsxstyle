'use strict';

var Color = require('../lib/Color');

var primaryColor = Color.rgb(10, 0, 0);
var secondaryColor = Color.alpha(primaryColor, .8);

var LayoutConstants = {
  primaryColor: primaryColor,
  secondaryColor: secondaryColor,
  gridUnit: 8,
}

module.exports = LayoutConstants;
