'use strict';

// TODO: break this into a separate module

var assign = require('object-assign');
var invariant = require('invariant');

function RGBA(r, g, b, a) {
  this.r = r;
  this.g = g;
  this.b = b;
  this.a = a;
}

assign(RGBA.prototype, {
  toString: function() {
    var params = this.r + ',' + this.g + ',' + this.b;
    if (typeof this.a === 'undefined') {
      return 'rgb(' + params + ')';
    }
    return 'rgba(' + params + ',' + this.a + ')';
  }
});

var Color = {
  rgb: function(r, g, b) {
    invariant(arguments.length === 3, 'rgb() takes only 3 arguments');
    return new RGBA(r, g, b);
  },

  rgba: function(r, g, b, a) {
    return new RGBA(r, g, b, a);
  },

  alpha: function(rgba, a) {
    return new RGBA(rgba.r, rgba.g, rgba.b, a);
  }
};

module.exports = Color;
