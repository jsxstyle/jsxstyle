import { describe, expect, it } from 'vitest';
import { withJsxstyle } from '../src/index.js';

describe('Next.js integration', () => {
  it('produces webpack and turbopack config from withJsxstyle()', () => {
    const nextConfig = withJsxstyle({
      classNameStrategy: 'hash',
      classNamePrefix: '_x',
    })({});

    // Verify withJsxstyle produces the expected config shape
    expect(nextConfig).toHaveProperty('webpack');
    expect(nextConfig).toHaveProperty('turbopack');
    expect(typeof nextConfig.webpack).toBe('function');
    expect(nextConfig.turbopack).toHaveProperty('rules');
  });

  it('configures turbopack rules for all extensions', () => {
    const nextConfig = withJsxstyle({
      classNameStrategy: 'hash',
      extensions: ['.ts', '.tsx', '.js', '.jsx'],
    })({});

    const rules = nextConfig.turbopack?.rules;
    expect(rules).toBeDefined();
    expect(rules['*.ts']).toBeDefined();
    expect(rules['*.tsx']).toBeDefined();
    expect(rules['*.js']).toBeDefined();
    expect(rules['*.jsx']).toBeDefined();

    // Verify loader path points to turbopack-loader
    const tsxRule = rules['*.tsx'];
    expect(tsxRule.loaders[0].loader).toContain('turbopack-loader');
    expect(tsxRule.loaders[0].options).toHaveProperty(
      'classNameStrategy',
      'hash'
    );
    expect(tsxRule.as).toBe('*.tsx');
  });

  it('turbopack options are JSON-serializable (no functions)', () => {
    const nextConfig = withJsxstyle({
      classNameStrategy: 'hash',
      classNamePrefix: '_x',
      debugClassNames: true,
      noRuntime: 'warn',
    })({});

    const rules = nextConfig.turbopack?.rules;
    const tsxRule = rules['*.tsx'];
    const options = tsxRule.loaders[0].options;

    // Verify all options are JSON-serializable (Turbopack requirement)
    const serialized = JSON.stringify(options);
    const deserialized = JSON.parse(serialized);
    expect(deserialized).toEqual(options);

    // Verify option values
    expect(options.classNameStrategy).toBe('hash');
    expect(options.classNamePrefix).toBe('_x');
    expect(options.debugClassNames).toBe(true);
    expect(options.noRuntime).toBe('warn');
  });

  it('preserves existing next config', () => {
    const existingConfig = {
      reactStrictMode: true,
      turbopack: {
        rules: {
          '*.mdx': { loaders: [{ loader: 'mdx-loader' }], as: '*.mdx' },
        },
      },
    };

    const nextConfig = withJsxstyle()(existingConfig);

    // Existing config preserved
    expect(nextConfig.reactStrictMode).toBe(true);

    // Existing turbopack rules preserved
    expect(nextConfig.turbopack.rules['*.mdx']).toBeDefined();

    // jsxstyle turbopack rules added
    expect(nextConfig.turbopack.rules['*.tsx']).toBeDefined();
  });

  it('uses hash strategy by default for Next.js', () => {
    const nextConfig = withJsxstyle()({});

    const rules = nextConfig.turbopack?.rules;
    const tsxRule = rules['*.tsx'];
    expect(tsxRule.loaders[0].options.classNameStrategy).toBe('hash');
  });

  it('validates options and rejects unknown keys', () => {
    expect(() => {
      withJsxstyle({ unknownOption: true } as any);
    }).toThrow(/unknown option/);
  });

  it('rejects boolean noRuntime', () => {
    expect(() => {
      withJsxstyle({ noRuntime: true } as any);
    }).toThrow(/no longer accepts boolean/);
  });

  it('rejects staticModules as unknown option', () => {
    // staticModules was removed -- it should now be rejected as unknown
    expect(() => {
      withJsxstyle({ staticModules: ['/path/to/module'] } as any);
    }).toThrow(/unknown option/);
  });
});
