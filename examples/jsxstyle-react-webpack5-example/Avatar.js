import { Block, Row } from '@jsxstyle/react';

import LayoutConstants from './LayoutConstants';

export default function Avatar(props) {
  return (
    <Row
      width={192}
      marginLeft="auto"
      marginRight="auto"
      color="black"
      hoverColor="white"
      backgroundColor="white"
      hoverBackgroundColor={LayoutConstants.secondaryColor}
      {...{
        '@media screen and (max-width: 900px)': {
          smColor: 'blue',
          smHoverColor: 'red',
        },
      }}
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
