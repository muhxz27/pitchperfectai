import type {
  AnchorHTMLAttributes,
  MouseEvent,
  ReactNode,
} from 'react';
import {
  isOnHomeRoute,
  rememberSection,
  scrollToSection,
} from '../../lib/sectionNavigation';

interface SectionLinkProps
  extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  sectionId: string;
  children: ReactNode;
}

export function SectionLink({
  sectionId,
  children,
  onClick,
  ...anchorProps
}: SectionLinkProps) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);

    if (event.defaultPrevented) {
      return;
    }

    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }

    if (isOnHomeRoute()) {
      event.preventDefault();
      scrollToSection(sectionId);
      return;
    }

    rememberSection(sectionId);
  }

  return (
    <a href="#/" onClick={handleClick} {...anchorProps}>
      {children}
    </a>
  );
}
