import { useMemo, useState, useEffect } from 'preact/hooks';

/**
 * Hook that returns the `true` if the provided media query matches.
 *
 * https://developer.mozilla.org/en-US/docs/Web/CSS/Media_Queries/Using_media_queries
 */
export const useMatchMedia = (mediaQuery: string): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  const deps = [mediaQuery];
  const mqList = useMemo(() => window.matchMedia(mediaQuery), deps);
  const [matches, setMatches] = useState(mqList.matches);

  useEffect(() => {
    const changeEventListener = (e: MediaQueryListEvent): void => {
      setMatches(e.matches);
    };

    try {
      // `MediaQueryList.addListener` is deprecated but more widely supported at the moment
      mqList.addListener(changeEventListener);
      return () => mqList.removeListener(changeEventListener);
    } catch (err) {
      mqList.addEventListener('change', changeEventListener);
      return () => mqList.removeEventListener('change', changeEventListener);
    }
  }, deps);

  return matches;
};
