import type { AstroIntegration } from 'astro';

export const jsxstyle = (): AstroIntegration => ({
  name: 'jsxstyle',
  hooks: {
    'astro:config:setup': ({ addMiddleware }) => {
      addMiddleware({
        entrypoint: new URL('./middleware.ts', import.meta.url),
        order: 'pre',
      });
    },
  },
});
