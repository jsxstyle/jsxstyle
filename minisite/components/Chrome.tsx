import Head from 'next/head';
import { Block } from 'jsxstyle';

interface ChromeProps {
  description?: string;
  title?: string;
}

export const Chrome: React.FC<ChromeProps> = ({
  children,
  title = 'jsxstyle—Inline styles for React',
  description = 'Simple and powerful team-friendly inline styling for React in just 3KB',
}) => {
  return (
    <div>
      <Head>
        <title>{title}</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width" />
      </Head>

      <Block component="main">{children}</Block>

      <style jsx global>{`
        html,
        body {
          font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto,
            Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue,
            sans-serif;
          font-size: 16px;
          line-height: 1.2;
          background-color: var(--jsxstyle-pageBackground);
        }

        * {
          box-sizing: border-box;
          padding: 0;
          margin: 0;
          font-size: inherit;
          line-height: inherit;
        }
      `}</style>
    </div>
  );
};
