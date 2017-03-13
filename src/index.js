'use strict';

const invariant = require('invariant');

const GlobalStylesheets = require('./GlobalStylesheets');
const JsxstyleDefaults = require('./JsxstyleDefaults');

const createCSS = require('./createCSS');
const makeStyleComponentClass = require('./makeStyleComponentClass');

module.exports = {
  install: GlobalStylesheets.install,

  Block: makeStyleComponentClass(JsxstyleDefaults.Block, 'Block'),
  Flex: makeStyleComponentClass(JsxstyleDefaults.Flex, 'Flex'),
  InlineBlock: makeStyleComponentClass(JsxstyleDefaults.InlineBlock, 'InlineBlock'),
  InlineFlex: makeStyleComponentClass(JsxstyleDefaults.InlineFlex, 'InlineFlex'),
  Table: makeStyleComponentClass(JsxstyleDefaults.Table, 'Table'),
  TableRow: makeStyleComponentClass(JsxstyleDefaults.TableRow, 'TableRow'),
  TableCell: makeStyleComponentClass(JsxstyleDefaults.TableCell, 'TableCell'),
  Inline: makeStyleComponentClass(JsxstyleDefaults.Inline, 'Inline'),
  Row: makeStyleComponentClass(JsxstyleDefaults.Row, 'Row'),
  Col: makeStyleComponentClass(JsxstyleDefaults.Col, 'Col'),

  injectAutoprefixer(autoprefix) {
    invariant(typeof autoprefix === 'function', 'You may only inject functions for autoprefix');
    createCSS.injection.autoprefix = autoprefix;
  },

  injectClassNameStrategy(getStylesheetId, formatClassNameFromId) {
    if (getStylesheetId) {
      invariant(typeof getStylesheetId === 'function', 'getStylesheetId must be a function');
      GlobalStylesheets.injection.getStylesheetId = getStylesheetId;
    }

    if (formatClassNameFromId) {
      invariant(typeof formatClassNameFromId === 'function', 'formatClassNameFromId must be a function');
      GlobalStylesheets.injection.formatClassNameFromId = formatClassNameFromId;
    }
  },
};
