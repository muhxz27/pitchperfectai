import { FileText, ListChecks, Mic } from 'lucide-react';
import styles from './HowItWorksSection.module.css';

const steps = [
  {
    number: '01',
    title: 'Paste your speech',
    description:
      'Bring your full draft, or the fragments you have so far. Start with the words as you would actually say them.',
    icon: FileText,
  },
  {
    number: '02',
    title: 'Get focused feedback',
    description:
      'Read the five dimensions, find the sentences that need another pass, and see what deserves your attention first.',
    icon: ListChecks,
  },
  {
    number: '03',
    title: 'Refine your delivery',
    description:
      'Rehearse the stronger version with practical cues for pacing, emphasis, and pauses.',
    icon: Mic,
  },
];

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className={styles.section}
      aria-labelledby="how-it-works-heading"
    >
      <div className="container">
        <div className={styles.headingRow}>
          <div>
            <p className={styles.eyebrow}>How it works</p>
            <h2 id="how-it-works-heading" className={styles.heading}>
              A stronger speech, <em>three steps</em> at a time.
            </h2>
          </div>
          <p className={styles.intro}>
            Start with the draft you have. Each pass gives you a clearer
            view of what to keep, what to change, and what to practise.
          </p>
        </div>

        <ol className={styles.steps}>
          {steps.map((step) => {
            const Icon = step.icon;

            return (
              <li key={step.number} className={styles.step}>
                <div className={styles.stepTop}>
                  <span className={styles.stepNumber}>
                    <span className={styles.stepKicker}>Step</span>
                    {step.number}
                  </span>
                  <span className={styles.iconWrap} aria-hidden="true">
                    <Icon size={20} strokeWidth={1.8} />
                  </span>
                </div>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepDescription}>
                  {step.description}
                </p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
