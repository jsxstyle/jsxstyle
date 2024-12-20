import type { AstroIntegration } from 'astro';

export const jsxstyle = (): AstroIntegration => ({
  name: 'jsxstyle',
  hooks: {
    'astro:config:setup': ({ addMiddleware }) => {
      addMiddleware({
        entrypoint: '@jsxstyle/astro/middleware',
        order: 'pre',
      });
    },
  },
});
