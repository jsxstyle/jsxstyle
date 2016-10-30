'use strict';

var Avatar = require('./Avatar');
var {Block} = require('../lib/Display');
var config = require('./jsxstyle.config')
var LayoutConstants = require('./LayoutConstants');
var React = require('react');
var ReactDOM = require('react-dom');

require('../').install(config);

ReactDOM.render(
  <Block
    name="list"
    marginLeft="auto"
    marginRight="auto"
    marginTop="128"
    border={'1px solid ' + LayoutConstants.secondaryColor}
    width={48 * LayoutConstants.gridUnit}
    minHeight={64}>
    <Avatar username="metallica" />
    <Avatar username="justintimberlake" />
    <Avatar username="carlyraejepsen" />
  </Block>,
  document.getElementById('container')
);
