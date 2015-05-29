'use strict';

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
    var params = Math.round(this.r) + ', ' + Math.round(this.g) + ', ' + Math.round(this.b);
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
  },

  shade: function(rgba, percent) {
    invariant(typeof percent === 'number' && percent >= 0 && percent <= 1, 'Percent must be between 0 and 1');
    return new RGBA(rgba.r * percent, rgba.g * percent, rgba.b * percent, rgba.a);
  },

  linearGradient: function(direction, points) {
    invariant(typeof direction === 'string', 'You must include a direction string');
    invariant(Array.isArray(points), 'points must be an array of arrays');
    return 'linear-gradient(' + direction + ', ' + points.map(function(point) {
      return point.join(' ');
    }).join(', ') + ')';
  },
};

module.exports = Color;
