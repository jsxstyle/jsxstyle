import 'core-js/es/map';
import 'core-js/es/set';

(global as any).requestAnimationFrame =
  window?.requestAnimationFrame || ((callback: any) => setTimeout(callback, 0));
