import { ActionLink } from '../ui/ActionLink';
import { Logo } from '../ui/Logo';
import { SectionLink } from '../ui/SectionLink';
import styles from './AppHeader.module.css';

export function AppHeader() {
  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        <Logo className={styles.logo} />

        <nav className={styles.nav} aria-label="Primary">
          <SectionLink
            sectionId="how-it-works"
            className={styles.navLink}
          >
            How it works
          </SectionLink>
          <SectionLink sectionId="product" className={styles.navLink}>
            What you get
          </SectionLink>
        </nav>

        <div className={styles.action}>
          <ActionLink to="#/workspace" className={styles.coachLink}>
            Coach my speech
          </ActionLink>
        </div>
      </div>
    </header>
  );
}
