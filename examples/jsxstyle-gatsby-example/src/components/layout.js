import React from 'react';
import Helmet from 'react-helmet';
import { StaticQuery, graphql } from 'gatsby';
import { Block } from 'jsxstyle';

import Header from './header';
import '../style.css';

const Layout = ({ children }) => (
  <StaticQuery
    query={graphql`
      query SiteTitleQuery {
        site {
          siteMetadata {
            title
          }
        }
      }
    `}
    render={(data) => (
      <>
        <Helmet
          title={data.site.siteMetadata.title}
          meta={[
            { name: 'description', content: 'Sample' },
            { name: 'keywords', content: 'sample, something' },
          ]}
        />
        <Header siteTitle={data.site.siteMetadata.title} />
        <Block
          margin="0 auto"
          maxWidth={960}
          padding="0px 1.0875rem 1.45rem"
          paddingTop={0}
        >
          {children}
        </Block>
      </>
    )}
  />
);

export default Layout;
