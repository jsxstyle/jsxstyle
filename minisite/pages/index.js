import Head from 'next/head';
import { Block } from 'jsxstyle';

export default function Home() {
  return (
    <div>
      <Head>
        <title>jsxstyle</title>
        <link rel="icon" href="/favicon.ico" />
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
