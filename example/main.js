'use strict';

var Avatar = require('./Avatar');
var {Block} = require('../lib/Display');
var {injectClassNameStrategy} = require('../');
var generateSha = require('git-sha1');
var LayoutConstants = require('./LayoutConstants');
var React = require('react');
var ReactDOM = require('react-dom');

injectClassNameStrategy(
  (id) => generateSha(id).substring(0, 6),
  (style) => `${style.name}__${style.id}`
)
require('../').install();

ReactDOM.render(
  <Block
    name="AvatarList"
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
