import { ArrowDown } from 'lucide-react';
import { ActionLink } from '../ui/ActionLink';
import { SectionLink } from '../ui/SectionLink';
import { ProductPreview } from './ProductPreview';
import styles from './HeroSection.module.css';

export function HeroSection() {
  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <div className={`container ${styles.grid}`}>
        <div className={styles.copy}>
          <p className={styles.eyebrow}>Your ideas, delivered better</p>
          <h1 id="hero-title" className={styles.headline}>
            <span className={styles.headlineLine}>
              You have something to say.
            </span>{' '}
            <span className={styles.headlineLine}>
              Make it <em>land.</em>
            </span>
          </h1>
          <p className={styles.lede}>
            PitchPerfect AI gives your speech a closer read, helping you
            strengthen its opening hook, clarity, structure, audience
            engagement, and conclusion — so your ideas are easier to
            follow when it matters.
          </p>
          <div className={styles.actions}>
            <ActionLink to="#/workspace" size="lg">
              Coach my speech
            </ActionLink>
            <SectionLink
              sectionId="how-it-works"
              className={styles.secondaryAction}
            >
              See how it works
              <ArrowDown size={16} aria-hidden="true" />
            </SectionLink>
          </div>
          <p className={styles.reassurance}>
            <span className={styles.reassuranceMark} aria-hidden="true" />
            Start with the draft you already have.
          </p>
        </div>

        <div className={styles.visual}>
          <ProductPreview />
        </div>
      </div>
    </section>
  );
}
