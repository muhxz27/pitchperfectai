import { Columns2, Gauge, Highlighter, ListChecks } from 'lucide-react';
import styles from './BenefitsSection.module.css';

const benefits = [
  {
    title: 'See the sentences that need work',
    description:
      'Find the lines that blur your point or make the audience work too hard, with an explanation you can use.',
    icon: Highlighter,
  },
  {
    title: 'Know where to start',
    description:
      'Get one clear improvement to focus on first, instead of a long list of equally urgent notes.',
    icon: ListChecks,
  },
  {
    title: 'Practise with purpose',
    description:
      'Use practical delivery cues for pacing, emphasis, and pauses as you rehearse.',
    icon: Gauge,
  },
  {
    title: 'Compare the stronger version',
    description:
      'Read your original alongside a revised draft, then copy the version you want to take to the stage.',
    icon: Columns2,
  },
];

export function BenefitsSection() {
  return (
    <section
      id="product"
      className={styles.section}
      aria-labelledby="product-heading"
    >
      <div className={`container ${styles.layout}`}>
        <div className={styles.intro}>
          <p className={styles.eyebrow}>What you get</p>
          <h2 id="product-heading" className={styles.heading}>
            Feedback that gives you a <em>next move.</em>
          </h2>
          <p className={styles.description}>
            A useful review should do more than describe the problem.
            PitchPerfect AI is designed to show you what to keep, what to
            change, and how to practise the difference.
          </p>

          <div className={styles.dimensions}>
            <p className={styles.dimensionsLabel}>The review covers</p>
            <p className={styles.dimensionsText}>
              Opening hook, clarity, structure, audience engagement, and
              conclusion.
            </p>
          </div>
        </div>

        <ul className={styles.cards}>
          {benefits.map((benefit) => {
            const Icon = benefit.icon;

            return (
              <li key={benefit.title} className={styles.card}>
                <span className={styles.iconWrap} aria-hidden="true">
                  <Icon size={20} strokeWidth={1.8} />
                </span>
                <h3 className={styles.cardTitle}>{benefit.title}</h3>
                <p className={styles.cardDescription}>
                  {benefit.description}
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
