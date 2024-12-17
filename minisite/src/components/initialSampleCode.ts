import codeSample from '../codeSample?raw';

export const initialSampleCode =
  (typeof window !== 'undefined' && window.sessionStorage.getItem('code')) ||
  codeSample;
