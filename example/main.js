'use strict';

var Avatar = require('./Avatar');
var {Block} = require('../lib/Display');
var LayoutConstants = require('./LayoutConstants');
var React = require('react');
var ReactDOM = require('react-dom');

ReactDOM.render(
  <Block
    marginLeft="auto"
    marginRight="auto"
    marginTop="128"
    fontFamily="Courier New"
    border={'1px solid ' + LayoutConstants.secondaryColor}
    width={48 * LayoutConstants.gridUnit}
    minHeight={64}>
    Hello world<br />
    <Avatar username="metallica" />
    <Avatar username="justintimberlake" />
    <Avatar username="carlyraejepsen" />
  </Block>,
  document.getElementById('container')
);
