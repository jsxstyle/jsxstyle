'use strict';

var React = require('react');
var createReactClass = require('create-react-class');

var assign = require('object-assign');

function curry(componentClass) {
  var args = Array.prototype.slice.call(arguments, 1);
  args.unshift({});
  var props = assign.apply(null, args);

  var propTypes = assign({}, componentClass.propTypes);
  for (var key in props) {
    delete propTypes[key];
  }

  return createReactClass({
    displayName: componentClass.displayName + ' (curried)',
    propTypes: propTypes,
    render: function() {
      return React.createElement(componentClass, assign({}, props, this.props));
    },
  });
}

module.exports = curry;
