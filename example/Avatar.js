'use strict';

var {Block, Flex} = require('../lib/Display');
var LayoutConstants = require('./LayoutConstants');
var React = require('react');

var Avatar = React.createClass({
  render: function() {
    return (
      <div role="button">
        <Flex
          name="Avatar"
          width={192}
          marginLeft="auto"
          marginRight="auto"
          hoverColor="white"
          color="black"
          cursor="pointer"
          hoverBackgroundColor={LayoutConstants.secondaryColor}
          alignItems="center">
          <img
            src={'http://graph.facebook.com/' + this.props.username + '/picture?type=large'}
            width={LayoutConstants.gridUnit * 6}
            height={LayoutConstants.gridUnit * 6}
          />
          <Block
            name="Username"
            marginLeft={LayoutConstants.gridUnit}>
            {this.props.username}
          </Block>
        </Flex>
      </div>
    );
  },
});

module.exports = Avatar;
