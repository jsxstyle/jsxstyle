'use strict';

var React = require('react');

var assign = require('object-assign');

function curry(componentClass, props) {
  var propTypes = assign({}, componentClass.propTypes);
  for (var key in props) {
    delete propTypes[key];
  }

  return React.createClass({
    displayName: componentClass.displayName + ' (curried)',
    propTypes: propTypes,
    render: function() {
      return React.createElement(componentClass, assign({}, props, this.props));
    },
  });
}

module.exports = curry;
