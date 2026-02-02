import * as React from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { JsxstyleCacheContext } from '../JsxstyleCacheProvider.js';
import {
  Box,
  Col,
  JsxstyleCacheProvider,
  RequestStyleCache,
  Row,
} from '../index.js';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe('JsxstyleCacheProvider', () => {
  it('creates an internal cache with classNamePrefix', () => {
    const html = renderToString(
      <JsxstyleCacheProvider classNamePrefix="_test">
        <Box color="red">Test</Box>
      </JsxstyleCacheProvider>
    );

    expect(html).toContain('class="_test0"');
  });

  it('creates an internal cache with deterministic classNameStyle', () => {
    const html1 = renderToString(
      <JsxstyleCacheProvider classNameStyle="deterministic">
        <Box color="red">First</Box>
      </JsxstyleCacheProvider>
    );

    const html2 = renderToString(
      <JsxstyleCacheProvider classNameStyle="deterministic">
        <Box color="red">Second</Box>
      </JsxstyleCacheProvider>
    );

    // Extract class names
    const class1 = html1.match(/class="([^"]+)"/)?.[1];
    const class2 = html2.match(/class="([^"]+)"/)?.[1];

    // Deterministic class names should be identical for identical styles
    expect(class1).toMatchInlineSnapshot(`"_1jvcvsh"`);
    expect(class1).toEqual(class2);
  });

  it('exposes internal cache via context', () => {
    let capturedCache: unknown;

    function CacheCapture() {
      capturedCache = React.useContext(JsxstyleCacheContext);
      return <Box color="blue">Capture</Box>;
    }

    renderToString(
      <JsxstyleCacheProvider classNamePrefix="_ctx">
        <CacheCapture />
      </JsxstyleCacheProvider>
    );

    if (!(capturedCache instanceof RequestStyleCache)) {
      throw new Error(
        'Expected capturedCache to be an instance of RequestStyleCache'
      );
    }

    expect(capturedCache.flushStyles()).toMatchInlineSnapshot(
      `"._ctx0{color:blue}"`
    );
  });

  describe('with RequestStyleCache', () => {
    it('isolates styles between concurrent requests', async () => {
      const request1 = async () => {
        console.log('request 1 start!');
        const cache = new RequestStyleCache();
        await delay(10);
        const html = renderToString(
          <JsxstyleCacheProvider cache={cache}>
            <Box color="red">Request 1</Box>
          </JsxstyleCacheProvider>
        );
        await delay(50); // Slow request
        console.log('request 1 end!');
        return { html, css: cache.flushStyles() };
      };

      const request2 = async () => {
        console.log('request 2 start!');
        const cache = new RequestStyleCache();
        await delay(30); // Starts mid-way through request 1
        const html = renderToString(
          <JsxstyleCacheProvider cache={cache}>
            <Box color="blue">Request 2</Box>
          </JsxstyleCacheProvider>
        );
        console.log('request 2 end!');
        return { html, css: cache.flushStyles() };
      };

      const [result1, result2] = await Promise.all([request1(), request2()]);

      // Each request's CSS should only contain its own styles
      expect(result1.css).toMatchInlineSnapshot(`"._x0{color:red}"`);
      // New cache means new classname cache, so we see `_x0` here again
      expect(result2.css).toMatchInlineSnapshot(`"._x0{color:blue}"`);
    });

    it('works as expected', async () => {
      const cache = new RequestStyleCache();
      const html = renderToString(
        <JsxstyleCacheProvider cache={cache}>
          <Row color="red">Row</Row>
          <Col color="blue">Col</Col>
          <Box color="green">Box</Box>
        </JsxstyleCacheProvider>
      );
      const css = cache.flushStyles();

      expect(css).toContain('{color:red}');
      expect(css).toContain('{color:blue}');
      expect(css).toContain('{color:green}');
      expect(css).toContain('{display:flex}');
      expect(html).toContain('>Row<');
      expect(html).toContain('>Col<');
      expect(html).toContain('>Box<');
    });

    it('flushes styles', async () => {
      const cache = new RequestStyleCache();

      renderToString(
        <JsxstyleCacheProvider cache={cache}>
          <Box color="red">First</Box>
        </JsxstyleCacheProvider>
      );
      const css1 = cache.flushStyles();

      renderToString(
        <JsxstyleCacheProvider cache={cache}>
          <Box color="blue">Second</Box>
        </JsxstyleCacheProvider>
      );
      const css2 = cache.flushStyles();

      // should only contain red
      expect(css1).toMatchInlineSnapshot(`"._x0{color:red}"`);
      // should not contain red since it's been seen before with this cache
      expect(css2).toMatchInlineSnapshot(`"._x1{color:blue}"`);
    });

    it('reuses class names for identical styles', async () => {
      const cache = new RequestStyleCache();

      const html = renderToString(
        <JsxstyleCacheProvider cache={cache}>
          <Box color="red" width={200}>
            First
          </Box>
          <Box color="red" width={200}>
            Second
          </Box>
        </JsxstyleCacheProvider>
      );
      const css = cache.flushStyles();
      expect(css).toMatchInlineSnapshot(`"._x0{color:red}._x1{width:200px}"`);

      // Both elements should have the same class
      const classMatch = html.match(/class="([^"]+)"/g);
      expect(classMatch).toHaveLength(2);
      expect(classMatch?.[0]).toEqual(classMatch?.[1]);
    });

    it('works with deterministic class names', async () => {
      const cache = new RequestStyleCache({ classNameStyle: 'deterministic' });

      renderToString(
        <JsxstyleCacheProvider cache={cache}>
          <Box color="red">Example</Box>
        </JsxstyleCacheProvider>
      );

      expect(cache.flushStyles()).toMatchInlineSnapshot(
        `"._1jvcvsh{color:red}"`
      );
    });
  });
});
