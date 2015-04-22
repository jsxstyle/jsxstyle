'use strict';

var {Block, Flex} = require('../lib/Display');
var LayoutConstants = require('./LayoutConstants');
var React = require('react');

var Avatar = React.createClass({
  getInitialState: function() {
    return {hovered: false};
  },

  handleMouseEnter: function() {
    this.setState({hovered: true});
  },

  handleMouseLeave: function() {
    this.setState({hovered: false});
  },

  render: function() {
    return (
      <div role="button" onMouseEnter={this.handleMouseEnter} onMouseLeave={this.handleMouseLeave}>
        <Flex
          width={192}
          marginLeft="auto"
          marginRight="auto"
          alignItems="center"
          background={this.state.hovered ? LayoutConstants.secondaryColor : null}>
          <img
            src={'http://graph.facebook.com/' + this.props.username + '/picture?type=large'}
            width={LayoutConstants.gridUnit * 6}
            height={LayoutConstants.gridUnit * 6}
          />
          <Block
            marginLeft={LayoutConstants.gridUnit}
            color={this.state.hovered ? 'white' : 'black'}>
            {this.props.username}
          </Block>
        </Flex>
      </div>
    );
  },
});

module.exports = Avatar;
