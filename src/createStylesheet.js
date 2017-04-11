'use strict';

const explodePseudoStyles = require('./explodePseudoStyles');
const createCSS = require('./createCSS');
const getClassName = require('./getClassName');

function createStylesheet(stylesheet) {
  const explodedStyles = explodePseudoStyles(stylesheet.style);
  const className = getClassName(stylesheet.key);

  const baseStyleText = createCSS(explodedStyles.base, className);
  const hoverStyleText = createCSS(explodedStyles.hover, className, ':hover');
  const activeStyleText = createCSS(explodedStyles.active, className, ':active');
  const focusStyleText = createCSS(explodedStyles.focus, className, ':focus');

  const styleElement = document.createElement('style');
  styleElement.type = 'text/css';
  styleElement.appendChild(document.createTextNode(`/* ${className} */`));
  document.head.appendChild(styleElement);

  if (baseStyleText !== '') {
    styleElement.sheet.insertRule(baseStyleText);
  }
  if (hoverStyleText !== '') {
    styleElement.sheet.insertRule(hoverStyleText);
  }
  if (activeStyleText !== '') {
    styleElement.sheet.insertRule(activeStyleText);
  }
  if (focusStyleText !== '') {
    styleElement.sheet.insertRule(focusStyleText);
  }

  return styleElement;
}

module.exports = createStylesheet;
