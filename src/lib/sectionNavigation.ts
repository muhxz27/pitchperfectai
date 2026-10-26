import { normalizePath, ROUTE_PATHS } from './routing';

let pendingSectionId: string | null = null;

export function rememberSection(sectionId: string) {
  pendingSectionId = sectionId;
}

export function consumePendingSection(): string | null {
  const sectionId = pendingSectionId;
  pendingSectionId = null;
  return sectionId;
}

export function scrollToSection(sectionId: string, behavior?: ScrollBehavior) {
  const target = document.getElementById(sectionId);

  if (!target) {
    return false;
  }

  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches;

  target.scrollIntoView({
    behavior:
      behavior ?? (prefersReducedMotion ? 'auto' : 'smooth'),
    block: 'start',
  });

  return true;
}

export function isOnHomeRoute() {
  return normalizePath(window.location.hash) === ROUTE_PATHS.home;
}
