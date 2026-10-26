import type { ReactNode } from 'react';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import styles from './WorkflowIntro.module.css';

export type WorkflowStep = 'write' | 'analyse' | 'refine';

interface WorkflowIntroProps {
  backHref: string;
  backLabel: string;
  eyebrow: string;
  title: ReactNode;
  titleId: string;
  description: string;
  currentStep: WorkflowStep;
}

const STEPS = [
  { id: 'write', number: '01', label: 'Write' },
  { id: 'analyse', number: '02', label: 'Analyse' },
  { id: 'refine', number: '03', label: 'Refine' },
] as const;

export function WorkflowIntro({
  backHref,
  backLabel,
  eyebrow,
  title,
  titleId,
  description,
  currentStep,
}: WorkflowIntroProps) {
  const currentIndex = STEPS.findIndex((step) => step.id === currentStep);

  return (
    <div className={styles.intro}>
      <a className={styles.backLink} href={backHref}>
        <ArrowLeft size={15} strokeWidth={2} aria-hidden="true" />
        <span>{backLabel}</span>
      </a>

      <p className={styles.eyebrow}>{eyebrow}</p>
      <h1 id={titleId} className={styles.title}>
        {title}
      </h1>
      <p className={styles.description}>{description}</p>

      <div className={styles.stepsWrap}>
        <ol className={styles.steps} aria-label="Speech workflow">
          {STEPS.map((step, index) => {
            const status =
              index < currentIndex
                ? 'complete'
                : index === currentIndex
                  ? 'current'
                  : 'upcoming';

            return (
              <li key={step.id} className={styles.stepItem}>
                <span
                  className={styles.step}
                  data-status={status}
                  aria-current={status === 'current' ? 'step' : undefined}
                >
                  <span className={styles.stepNumber}>{step.number}</span>
                  <span className={styles.stepLabel}>{step.label}</span>
                  {status === 'complete' ? (
                    <>
                      <Check
                        className={styles.stepCheck}
                        size={13}
                        strokeWidth={2.4}
                        aria-hidden="true"
                      />
                      <span className="visually-hidden"> completed</span>
                    </>
                  ) : null}
                </span>

                {index < STEPS.length - 1 ? (
                  <ArrowRight
                    className={styles.stepArrow}
                    size={14}
                    strokeWidth={1.8}
                    aria-hidden="true"
                  />
                ) : null}
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
