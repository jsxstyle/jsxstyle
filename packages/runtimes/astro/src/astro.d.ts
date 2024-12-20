import type { RequestStyleCache } from '@jsxstyle/core';

declare global {
  namespace App {
    interface Locals {
      jsxstyleCache?: RequestStyleCache;
    }
  }
}
