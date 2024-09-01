/* eslint-disable @typescript-eslint/no-explicit-any, no-prototype-builtins */
import type * as t from '@babel/types';
import { generate } from './babelUtils';
import type { OptionsObject } from './extractStyles';
import type { flattenSpreadAttributes } from './flattenSpreadAttributes';
import { getValue } from './getValue';
import { normalizeTernary } from './normalizeTernary';
import { primitiveValueToNode } from './primitiveValueToNode';
import { type StaticStyleObject, updateStyleObject } from './styleObjectUtils';

const eventHandlerRegex = /^on[A-Z]/;

const knownComponentProps = {
  checked: true,
  children: true,
  class: true,
  className: true,
  component: true,
  disabled: true,
  href: true,
  id: true,
  key: true,
  mediaQueries: true,
  name: true,
  placeholder: true,
  props: true,
  ref: true,
  style: true,
  type: true,
  value: true,
};

export const evaluateAttributes = (
  attributeMap: ReturnType<typeof flattenSpreadAttributes>,
  options: OptionsObject
) => {
  const {
    logWarning,
    logError,
    mediaQueriesByKey: mediaQueryIdentifierMap,
    attemptEval,
    noRuntime,
  } = options;

  const componentProps = new Map<string, t.Expression>();
  let classNameNode: t.Expression | null = null;
  const styleObj: StaticStyleObject = {};
  let runtimeRequired = false;

  for (const [key, value] of attributeMap.entries()) {
    const isComponentProp =
      eventHandlerRegex.test(key) || knownComponentProps.hasOwnProperty(key);

    if (isComponentProp) {
      let nodeValue: t.Expression;
      if (value.type === 'node' && value.value != null) {
        nodeValue = value.value;
      } else {
        nodeValue = primitiveValueToNode(value.value);
      }

      if (key === 'class' || key === 'className') {
        classNameNode = nodeValue;
      } else {
        componentProps.set(key, nodeValue);
      }
      continue;
    }

    if (value.type === 'primitive') {
      updateStyleObject(key, value, styleObj);
      continue;
    }

    // attempt to evaluate the prop. if it fails, add the prop to componentProps
    // and set `runtimeRequired` to `true`.
    try {
      if (
        value.value.type === 'ConditionalExpression' ||
        value.value.type === 'LogicalExpression'
      ) {
        const normalizedValue = normalizeTernary(value.value);
        // handle useMatchMedia ternaries/conditionals
        if (normalizedValue.test.type === 'Identifier') {
          const mq = mediaQueryIdentifierMap[normalizedValue.test.name];
          if (mq) {
            // biome-ignore lint/suspicious/noAssignInExpressions: chill
            const styles = (styleObj.styles ||= {});
            // biome-ignore lint/suspicious/noAssignInExpressions: chill
            const mqStyles = (styles[`@media ${mq}`] ||= {});
            styles[key] = attemptEval(normalizedValue.alternate);
            mqStyles[key] = attemptEval(normalizedValue.consequent);
            continue;
          }
        }

        updateStyleObject(
          key,
          {
            type: 'ternary',
            test: normalizedValue.test,
            alternate: getValue(normalizedValue.alternate, attemptEval),
            consequent: getValue(normalizedValue.consequent, attemptEval),
          },
          styleObj
        );
        continue;
      }

      updateStyleObject(key, getValue(value.value, attemptEval), styleObj);
    } catch (error) {
      if (noRuntime) {
        logError(
          'Could not evaluate prop `%s` (value: %s)',
          key,
          generate(value.value).code
        );
      }
      runtimeRequired = true;
      componentProps.set(key, value.value);
    }
  }

  // jsxstyle components are function components and therefore cannot accept refs.
  // this forwards the error on to the client.
  if (componentProps.has('ref')) {
    const logFn = noRuntime ? logError : logWarning;
    logFn(
      'The `ref` prop cannot be extracted from a jsxstyle component. ' +
        'If you want to attach a ref to the underlying component or element, ' +
        'specify a `ref` property in the `props` object.'
    );
    runtimeRequired = true;
  }

  return {
    styleObj,
    componentProps,
    runtimeRequired,
    classNameNode,
  };
};
