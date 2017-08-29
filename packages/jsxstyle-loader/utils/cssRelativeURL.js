'use strict';

const valueParser = require('postcss-value-parser');
const invariant = require('invariant');
const path = require('path');

// there has got to be a better way to scrape loader strings off URL strings.
// loaderUtils?
const inlineLoaderRegex = /^((?:!!?|-!)?(?:[\w-]+(?:\?[^!]*)?!)*)/;

/**
 * rewrite relative url() values to be relative to a different path
 * @param {string} propValue value of the CSS prop to be parsed
 * @param {string} sourceDir path to the directory the CSS file is in
 * @param {string} rootDir path to the directory the CSS file will be in
 */
function cssRelativeURL(propValue, sourceDir, rootDir) {
  invariant(
    path.isAbsolute(sourceDir),
    'param 2 is expected to be an absolute path'
  );

  invariant(
    path.isAbsolute(rootDir),
    'param 3 is expected to be an absolute path'
  );

  const parsed = valueParser(propValue);

  parsed.walk(node => {
    if (
      // we only care about URL functions...
      node.type !== 'function' ||
      node.value !== 'url' ||
      // ..with one value...
      node.nodes.length !== 1 ||
      // ...that's a string, quoted or unquoted.
      (node.nodes[0].type !== 'word' && node.nodes[0].type !== 'string') ||
      node.nodes[0].value.trim() === ''
    )
      return;

    const firstNode = node.nodes[0];
    const bits = firstNode.value.split(inlineLoaderRegex);
    const bitLen = bits.length;

    let prefix;
    let urlPath;

    if (bitLen === 1) {
      prefix = '';
      urlPath = firstNode.value;
    } else if (bitLen === 3) {
      prefix = bits[1];
      urlPath = bits[2];
    } else {
      // idk
      invariant(false, 'why have you given me %s things', bitLen);
    }

    // ignore invalid URLs/URIs
    if (
      // absolute URLs or protocol-relative URLs
      urlPath[0] === '/' ||
      // data URIs
      urlPath.startsWith('data:') ||
      // whatever://
      /^[\w-]+:\/\//.test(firstNode.value) ||
      // non-relative initial characters
      !/^[a-z.]/gi.test(urlPath)
    )
      return;

    const absoluteSourcePath = path.join(sourceDir, urlPath);
    let newPath = path.relative(rootDir, absoluteSourcePath);

    if (!newPath.startsWith('.')) {
      newPath = './' + newPath;
    }

    node.nodes = [
      {
        type: 'string',
        // TODO: less naive CSS string escaping?
        value: (prefix + newPath).replace(/"/g, '\\"'),
        quote: '"',
      },
    ];
  });

  return parsed.toString();
}

module.exports = cssRelativeURL;
