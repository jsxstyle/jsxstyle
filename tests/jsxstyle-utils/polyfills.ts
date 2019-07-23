import 'core-js/es6/map';
import 'core-js/es6/set';

(global as any).requestAnimationFrame =
  (window != null && window.requestAnimationFrame) ||
  (callback => setTimeout(callback, 0));
