import React from 'react';
import {Block, Row} from 'jsxstyle';

import LayoutConstants from './LayoutConstants';

export default function Avatar(props) {
  return (
    <Row
      width={192}
      marginLeft="auto"
      marginRight="auto"
      alignItems="center"
      color="black"
      hoverColor="white"
      backgroundColor="white"
      hoverBackgroundColor={LayoutConstants.secondaryColor}>
      <Block
        style={{
          backgroundImage: `url("http://graph.facebook.com/${props.username}/picture?type=large")`,
        }}
        backgroundSize="contain"
        width={LayoutConstants.gridUnit * 6}
        height={LayoutConstants.gridUnit * 6}
      />
      <Block marginLeft={LayoutConstants.gridUnit}>
        {props.username}
      </Block>
    </Row>
  );
}

Avatar.propTypes = {
  username: React.PropTypes.string.isRequired,
};
