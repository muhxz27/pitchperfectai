import type { MouseEvent, ReactNode } from 'react';
import { AppFooter } from './AppFooter';
import { AppHeader } from './AppHeader';
import styles from './AppShell.module.css';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  function skipToContent(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    const main = document.getElementById('main-content');

    if (main) {
      main.focus();
    }
  }

  return (
    <div className={styles.app}>
      <a
        className="skip-link"
        href="#main-content"
        onClick={skipToContent}
      >
        Skip to content
      </a>
      <AppHeader />
      <main
        id="main-content"
        className={styles.main}
        tabIndex={-1}
      >
        {children}
      </main>
      <AppFooter />
    </div>
  );
}
