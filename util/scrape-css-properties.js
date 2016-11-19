var https = require('https');

var URL = 'https://developer.mozilla.org/en-US/docs/Web/CSS/Reference';

var RE_PROPERTY_URL = /<a.*?href="\/en-US\/docs\/Web\/CSS\/(.*?)".*?><code>(.*?)<\/code><\/a>/ig;
var RE_VALID_PROPERTY = /^[^:@\-][^#_]+[^(\(\))]$/;

fetch(URL, function(html) {
  var props = filter(parse(html));
  var values = props.map(prop => `  '${prop}': true,`).join('\n');
  print(`'use strict';\n`);
  print(`// Source: ${URL}\n`);
  print(`var CSSProperties = {\n${values}\n};\n`);
  print(`module.exports = CSSProperties;`);
});

function fetch(url, cb) {
  https.get(url, res => {
    var chunks = [];
    res.on('data', chunk => chunks.push(chunk));
    res.on('end', () => cb(chunks.join('')));
  });
}

function parse(html) {
  var result;
  var props = [];
  while (result = RE_PROPERTY_URL.exec(html)) {
    props.push({id: result[1], name: result[2]});
  }
  return props;
}

function filter(props) {
  return props.filter(prop => {
    return RE_VALID_PROPERTY.test(prop.id) && RE_VALID_PROPERTY.test(prop.name);
  }).map(normalize);
}

function normalize(prop) {
    return prop.id.split('-').map((term, i) => {
      return i ? term[0].toUpperCase() + term.slice(1) : term;
    }).join('');
}

function print(line) {
  process.stdout.write(line + '\n');
}
