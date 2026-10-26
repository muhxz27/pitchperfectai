import { useSyncExternalStore } from 'react';

export const ROUTE_PATHS = {
  home: '/',
  workspace: '/workspace',
  analysis: '/analysis',
  revision: '/revision',
} as const;

export type AppPath = (typeof ROUTE_PATHS)[keyof typeof ROUTE_PATHS];

export const ROUTE_TITLES: Record<AppPath, string> = {
  '/': 'PitchPerfect AI — You have something to say',
  '/workspace': 'Speech workspace — PitchPerfect AI',
  '/analysis': 'Your speech analysis — PitchPerfect AI',
  '/revision': 'Speech revision — PitchPerfect AI',
};

export function normalizePath(hash: string): string {
  const rawPath = hash.replace(/^#/, '');

  if (!rawPath) {
    return ROUTE_PATHS.home;
  }

  const withLeadingSlash = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
  return withLeadingSlash.length > 1
    ? withLeadingSlash.replace(/\/+$/, '')
    : withLeadingSlash;
}

function subscribeToHashChange(callback: () => void) {
  window.addEventListener('hashchange', callback);
  return () => window.removeEventListener('hashchange', callback);
}

function getHashPath() {
  return normalizePath(window.location.hash);
}

export function useHashRoute(): string {
  return useSyncExternalStore(subscribeToHashChange, getHashPath);
}
