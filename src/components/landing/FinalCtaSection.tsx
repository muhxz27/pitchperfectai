import { ActionLink } from '../ui/ActionLink';
import styles from './FinalCtaSection.module.css';

export function FinalCtaSection() {
  return (
    <section
      className={styles.section}
      aria-labelledby="final-cta-heading"
    >
      <div className="container">
        <div className={styles.panel}>
          <div className={styles.copy}>
            <p className={styles.eyebrow}>Ready when you are</p>
            <h2 id="final-cta-heading" className={styles.heading}>
              Your next speech deserves a <em>second listen.</em>
            </h2>
            <p className={styles.description}>
              Bring the draft you have. The workspace is where the next
              pass begins.
            </p>
          </div>

          <div className={styles.action}>
            <ActionLink
              to="#/workspace"
              variant="inverse"
              size="lg"
            >
              Open the workspace
            </ActionLink>
          </div>
        </div>
      </div>
    </section>
  );
}
