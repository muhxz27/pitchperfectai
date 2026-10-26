import { Logo } from '../ui/Logo';
import { SectionLink } from '../ui/SectionLink';
import styles from './AppFooter.module.css';

export function AppFooter() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.about}>
          <Logo />
          <p className={styles.description}>
            PitchPerfect AI helps students, speakers, and
            professionals make their ideas clearer, better structured,
            and easier to deliver.
          </p>
        </div>

        <nav className={styles.nav} aria-label="Footer">
          <p className={styles.navLabel}>Explore</p>
          <div className={styles.links}>
            <SectionLink sectionId="product" className={styles.link}>
              What you get
            </SectionLink>
            <SectionLink
              sectionId="how-it-works"
              className={styles.link}
            >
              How it works
            </SectionLink>
            <a href="#/workspace" className={styles.link}>
              Workspace
            </a>
          </div>
        </nav>
      </div>

      <div className={`container ${styles.meta}`}>
        <p>© {new Date().getFullYear()} PitchPerfect AI.</p>
        <p>Dashboard preview uses illustrative sample data.</p>
      </div>
    </footer>
  );
}
