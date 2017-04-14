const React = require('react');
const {Block, InlineBlock} = require('../');

<Block width="100%" height={25} left={2 * LayoutConstants.x} hoverColor="blue" hoverBackgroundColor="white">
  <InlineBlock height={24} />
  <div style={{width: 10}} />
  <OtherComponent height={25} />
</Block>;
