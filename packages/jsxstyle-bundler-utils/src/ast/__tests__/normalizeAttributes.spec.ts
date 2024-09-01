import { generate, parse, traverse } from '../babelUtils';
import { flattenSpreadAttributes } from '../flattenSpreadAttributes';
import { getEvaluateAstNodeWithScopeFunction } from '../getEvaluateAstNodeWithScopeFunction';

describe('flattenSpreadAttributes', () => {
  it('works', () => {
    const ast = parse(`
    const wow = { color: 'orange' };

    import { useMatchMedia } from 'jsxstyle';

    const isSmallScreen = useMatchMedia('screen and (max-width: 800px)');

    <Block
      {...{
        wow: 'ok'
      }}
      width={isSmallScreen ? '100%' : '80%'}
      height={condition ? '100%' : isSmallScreen ? 'auto' : null}
      className="banana"
      banana={!condition ? 'red' : otherCondition ? 'orange' : 'purple'}
      thing1={condition && 'blue'}
      {...wow}
      backgroundColor="blue"
    />
    `);

    const results: Array<ReturnType<typeof flattenSpreadAttributes>> = [];

    traverse(ast, {
      JSXElement(nodePath) {
        const attemptEval = getEvaluateAstNodeWithScopeFunction(
          nodePath,
          undefined,
          'test.js',
          {}
        );

        results.push(
          flattenSpreadAttributes(
            nodePath.node.openingElement.attributes,
            attemptEval
          )
        );
      },
    });

    expect(
      Array.from(results[0].entries()).reduce((p, [k, v]) => {
        return (
          p +
          `${k} (${v.type}): ${
            v.type === 'primitive' ? v.value : generate(v.value).code
          }\n`
        );
      }, '\n')
    ).toMatchInlineSnapshot(`
      "
      wow (primitive): ok
      width (node): isSmallScreen ? '100%' : '80%'
      height (node): condition ? '100%' : isSmallScreen ? 'auto' : null
      className (node): "banana"
      banana (node): !condition ? 'red' : otherCondition ? 'orange' : 'purple'
      thing1 (node): condition && 'blue'
      color (primitive): orange
      backgroundColor (node): "blue"
      "
    `);
  });
});
