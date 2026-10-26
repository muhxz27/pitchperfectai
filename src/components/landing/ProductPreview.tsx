import {
  AudioLines,
  Columns2,
  PenLine,
  ScanSearch,
  Target,
} from 'lucide-react';
import { previewAnalysis } from '../../data/previewAnalysis';
import styles from './ProductPreview.module.css';

export function ProductPreview() {
  return (
    <figure
      className={styles.window}
      aria-label="Illustrative preview of the PitchPerfect AI analysis dashboard"
    >
      <div className={styles.chrome}>
        <span className={styles.appIdentity}>
          <span className={styles.appMark} aria-hidden="true">
            <AudioLines size={13} strokeWidth={2.2} />
          </span>
          <span className={styles.appName}>PitchPerfect</span>
        </span>
        <span className={styles.chromeTitle}>Speech analysis</span>
        <span className={styles.exampleBadge}>Illustrative preview</span>
      </div>

      <div className={styles.shell}>
        <div className={styles.rail} aria-hidden="true">
          <span className={styles.railItem}>
            <PenLine size={15} strokeWidth={1.8} />
          </span>
          <span className={`${styles.railItem} ${styles.railItemActive}`}>
            <ScanSearch size={15} strokeWidth={1.8} />
          </span>
          <span className={styles.railItem}>
            <Columns2 size={15} strokeWidth={1.8} />
          </span>
        </div>

        <div className={styles.workspace}>
          <div className={styles.doc}>
            <p className={styles.context}>{previewAnalysis.context}</p>
            <p className={styles.speechTitle}>
              {previewAnalysis.speechTitle}
            </p>
          </div>

          <div className={styles.scoreMeta}>
            <span>Five dimensions</span>
            <span>Sample score / 10</span>
          </div>

          <ul className={styles.scoreList}>
            {previewAnalysis.scores.map((dimension) => (
              <li key={dimension.label} className={styles.scoreRow}>
                <div className={styles.scoreTop}>
                  <span className={styles.scoreLabel}>
                    {dimension.label}
                  </span>
                  <span className={styles.scoreValue}>
                    {dimension.score.toFixed(1)}
                    <span className={styles.scoreOutOf}> / 10</span>
                  </span>
                </div>
                <span className={styles.track} aria-hidden="true">
                  <span
                    className={styles.fill}
                    style={{ width: `${dimension.score * 10}%` }}
                  />
                </span>
              </li>
            ))}
          </ul>

          <div className={styles.priority}>
            <span className={styles.priorityIcon} aria-hidden="true">
              <Target size={16} strokeWidth={1.8} />
            </span>
            <div className={styles.priorityBody}>
              <p className={styles.priorityLabel}>Priority focus</p>
              <p className={styles.priorityTitle}>
                {previewAnalysis.priority.title}
              </p>
              <p className={styles.priorityDescription}>
                {previewAnalysis.priority.description}
              </p>
            </div>
          </div>

          <div className={styles.feedback}>
            <div className={styles.feedbackTop}>
              <span className={styles.feedbackLabel}>
                Example feedback
              </span>
              <span className={styles.feedbackTag}>Sample line</span>
            </div>
            <blockquote className={styles.quote}>
              {`“${previewAnalysis.feedback.before}`}
              <mark>{previewAnalysis.feedback.highlight}</mark>
              {`${previewAnalysis.feedback.after}”`}
            </blockquote>
            <p className={styles.feedbackNote}>
              {previewAnalysis.feedback.note}
            </p>
          </div>

          <figcaption className={styles.caption}>
            Illustrative sample data. No real speech has been analysed.
          </figcaption>
        </div>
      </div>
    </figure>
  );
}
