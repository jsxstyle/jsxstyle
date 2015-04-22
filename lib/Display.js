'use strict';

var CSSDisplayNames = require('./CSSDisplayNames');
var makeStyleComponentClass = require('./makeStyleComponentClass');

var Display = {};

for (var name in CSSDisplayNames) {
  var display = CSSDisplayNames[name];
  Display[name] = makeStyleComponentClass({display: display}, name);
}

module.exports = Display;
