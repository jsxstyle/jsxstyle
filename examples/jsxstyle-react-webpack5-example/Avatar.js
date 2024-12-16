import { Block, Row } from '@jsxstyle/react';
import PropTypes from 'prop-types';

import LayoutConstants from './LayoutConstants';

export default function Avatar(props) {
  return (
    <Row
      width={192}
      marginLeft="auto"
      marginRight="auto"
      mediaQueries={{
        sm: 'screen and (max-width: 900px)',
      }}
      color="black"
      smColor="blue"
      hoverColor="white"
      smHoverColor="red"
      backgroundColor="white"
      hoverBackgroundColor={LayoutConstants.secondaryColor}
    >
      <Block
        style={{
          backgroundImage: `url("http://graph.facebook.com/${props.username}/picture?type=large")`,
        }}
        backgroundSize="contain"
        width={LayoutConstants.gridUnit * 6}
        height={LayoutConstants.gridUnit * 6}
      />
      <Block marginLeft={LayoutConstants.gridUnit}>{props.username}</Block>
    </Row>
  );
}

Avatar.propTypes = {
  username: PropTypes.string.isRequired,
};
