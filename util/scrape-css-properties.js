var https = require('https');

var URL = 'https://developer.mozilla.org/en-US/docs/tag/CSS%20Property';

var RE_PROPERTY_URL = /<a.*?href="\/en-US\/docs\/Web\/CSS\/(.*?)".*?>(.*?)<\/a>/ig;
var RE_VALID_PROPERTY = /^[^:@\-<][^#_]+[^(\(\))>]$/;
var RE_NEXT_URL = /<li class="next">.*?<a.*?href="(.*?)">.*?<\/a>.*?<\/li>/i;

scrape(URL, [], props => {
  var values = props.map(prop => `  '${prop}': true,`).join('\n');
  print(`'use strict';\n`);
  print(`// Source: ${URL}\n`);
  print(`var CSSProperties = {\n${values}\n};\n`);
  print(`module.exports = CSSProperties;`);
});

function scrape(url, props, cb) {
  fetch(url, html => {
    props = props.concat(extractProps(html));
    var next = extractNextURL(html);
    if (next) {
      scrape(next, props, cb);
    } else {
      cb(props);
    }
  });
}

function fetch(url, cb) {
  https.get(url, res => {
    var chunks = [];
    res.on('data', chunk => chunks.push(chunk));
    res.on('end', () => cb(chunks.join('').split(/[\r\n]+/).join(' ')));
  });
}

function print(line) {
  process.stdout.write(line + '\n');
}

function unescape(s) {
  return s
    .replace('&lt;', '<')
    .replace('&gt;', '>')
    .replace('&amp;', '&');
}

function normalize(prop) {
  return prop.split('-').map((term, i) => {
    return i ? term[0].toUpperCase() + term.slice(1) : term;
  }).join('');
}

function extractProps(html) {
  var result;
  var props = [];
  while (result = RE_PROPERTY_URL.exec(html)) {
    var prop = unescape(result[1]);
    if (RE_VALID_PROPERTY.test(prop)) {
      props.push(normalize(prop));
    }
  }
  return props;
}

function extractNextURL(html) {
  var result = RE_NEXT_URL.exec(html);
  return result ? result[1] : null;
}
