import Head from 'next/head';
import { Block } from 'jsxstyle';

export default function Home() {
  return (
    <div>
      <Head>
        <title>jsxstyle—Inline styles for React</title>
        <link rel="icon" href="/favicon.ico" />
        <meta
          name="description"
          content="Simple and powerful team-friendly inline styling for React in just 3KB"
        />
        <meta name="viewport" content="width=device-width" />
      </Head>

      <Block component="main" paddingH={20} paddingV={20} fontSize={24}>
        <p>Hello!</p>
      </Block>

      <style jsx global>{`
        html,
        body {
          font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto,
            Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue,
            sans-serif;
          font-size: 16px;
          line-height: 1.2;
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
}
