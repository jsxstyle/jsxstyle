import { CSSProperties } from 'jsxstyle';

declare module 'jsxstyle' {
  export interface CSSProperties {
    hoverBackground?: CSSProperties['background'];
  }
}
