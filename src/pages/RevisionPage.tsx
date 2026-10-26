import { useId, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Check,
  Copy,
  FileText,
  FlaskConical,
  PenLine,
} from 'lucide-react';
import { ActionLink } from '../components/ui/ActionLink';
import { WorkflowIntro } from '../components/workspace/WorkflowIntro';
import {
  IMPROVED_EXAMPLE_NOTE,
  SAMPLE_REVISION_LABEL,
  SAMPLE_REVISION_NOTE,
  sampleRevision,
} from '../lib/revisionSample';
import {
  countWords,
  getAudienceLabel,
  getGoalLabel,
  type SpeechDraft,
} from '../lib/speechDraft';
import styles from './RevisionPage.module.css';

interface RevisionPageProps {
  draft: SpeechDraft;
}

type CopyStatus = 'idle' | 'copying' | 'success' | 'error' | 'unavailable';

const improvedSpeechText =
  sampleRevision.improvedSpeech.paragraphs.join('\n\n');
const improvedWordCount = countWords(improvedSpeechText);

function formatIndex(index: number) {
  return String(index + 1).padStart(2, '0');
}

export function RevisionPage({ draft }: RevisionPageProps) {
  const id = useId();
  const pageTitleId = `${id}-title`;
  const comparisonTitleId = `${id}-comparison`;
  const originalTitleId = `${id}-original`;
  const improvedTitleId = `${id}-improved`;
  const changesTitleId = `${id}-changes`;
  const nextTitleId = `${id}-next`;
  const copyFeedbackId = `${id}-copy-feedback`;

  const [copyStatus, setCopyStatus] = useState<CopyStatus>('idle');

  const wordCount = countWords(draft.speech);
  const wordLabel = wordCount === 1 ? 'word' : 'words';
  const hasOriginal = draft.speech.trim().length > 0;
  const displayTitle = draft.title.trim() || 'Untitled speech';
  const isCopying = copyStatus === 'copying';

  const copyFeedback =
    copyStatus === 'success'
      ? 'Improved example copied to your clipboard.'
      : copyStatus === 'error'
        ? 'That copy didn’t work. Select the text above and copy it manually.'
        : copyStatus === 'unavailable'
          ? 'Clipboard access isn’t available here. Select the text above and copy it manually.'
          : '';

  async function copyImprovedExample() {
    setCopyStatus('copying');

    try {
      const clipboard = navigator.clipboard;

      if (!clipboard?.writeText) {
        setCopyStatus('unavailable');
        return;
      }

      await clipboard.writeText(improvedSpeechText);
      setCopyStatus('success');
    } catch {
      setCopyStatus('error');
    }
  }

  return (
    <section className={styles.page} aria-labelledby={pageTitleId}>
      <div className="container">
        <WorkflowIntro
          backHref="#/analysis"
          backLabel="Back to analysis"
          eyebrow="Revision · Step 3 of 3"
          title={
            <>
              Make every <em>word</em> count.
            </>
          }
          titleId={pageTitleId}
          description="Revision gives you room to sharpen clarity, steady the flow, and strengthen the impact on your audience. The comparison below is a fixed demonstration, not a live rewrite of your words."
          currentStep="refine"
        />

        {!hasOriginal ? (
          <div className={styles.emptyPanel}>
            <div className={styles.emptyTop}>
              <span className={styles.sampleBadge}>
                <FlaskConical
                  size={14}
                  strokeWidth={1.9}
                  aria-hidden="true"
                />
                {SAMPLE_REVISION_LABEL}
              </span>
              <span className={styles.fixtureFlag}>
                No comparison without a draft
              </span>
            </div>

            <div className={styles.emptyContent}>
              <span className={styles.emptyIcon} aria-hidden="true">
                <PenLine size={24} strokeWidth={1.7} />
              </span>
              <div className={styles.emptyBody}>
                <p className={styles.stateLabel}>Draft needed</p>
                <h2 className={styles.emptyTitle}>
                  There’s nothing to revise yet.
                </h2>
                <p className={styles.emptyText}>
                  Write or paste your speech in the workspace, then return to
                  this step. Your original wording stays intact, and no
                  comparison is shown until there is a draft to place beside
                  the example.
                </p>
                <div className={styles.emptyActions}>
                  <ActionLink to="#/workspace" size="lg">
                    Go to workspace
                  </ActionLink>
                  <a href="#/" className={styles.textLink}>
                    Back to landing page
                  </a>
                </div>
                <p className={styles.emptyCount}>
                  Current draft length: {wordCount}{' '}
                  {wordCount === 1 ? 'word' : 'words'}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.revision}>
            <header className={styles.overview}>
              <div className={styles.overviewTop}>
                <span className={styles.sampleBadge}>
                  <FlaskConical
                    size={14}
                    strokeWidth={1.9}
                    aria-hidden="true"
                  />
                  {SAMPLE_REVISION_LABEL}
                </span>
                <span className={styles.fixtureFlag}>
                  Fixed fixture · no live AI
                </span>
              </div>

              <div className={styles.overviewMain}>
                <div className={styles.overviewCopy}>
                  <p className={styles.overviewEyebrow}>
                    Your draft, in revision
                  </p>
                  <h2
                    className={styles.speechTitle}
                    data-empty={
                      draft.title.trim().length === 0 ? 'true' : 'false'
                    }
                  >
                    {displayTitle}
                  </h2>
                  <dl className={styles.draftMeta}>
                    <div className={styles.metaItem}>
                      <dt>Audience</dt>
                      <dd>{getAudienceLabel(draft.audience)}</dd>
                    </div>
                    <div className={styles.metaItem}>
                      <dt>Goal</dt>
                      <dd>{getGoalLabel(draft.goal)}</dd>
                    </div>
                    <div className={styles.metaItem}>
                      <dt>Draft length</dt>
                      <dd>
                        {wordCount} {wordLabel}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className={styles.overviewActions}>
                  <ActionLink
                    to="#/workspace"
                    variant="secondary"
                    size="lg"
                  >
                    Edit your draft
                  </ActionLink>
                  <a href="#/analysis" className={styles.textLink}>
                    View the analysis
                  </a>
                </div>
              </div>

              <p className={styles.overviewNote}>{SAMPLE_REVISION_NOTE}</p>
            </header>

            <section
              className={styles.comparisonSection}
              aria-labelledby={comparisonTitleId}
            >
              <div className={styles.sectionHeader}>
                <div>
                  <p className={styles.eyebrow}>Before &amp; after</p>
                  <h2 id={comparisonTitleId} className={styles.sectionTitle}>
                    One draft, two readings.
                  </h2>
                </div>
                <p className={styles.sectionLedger}>
                  Your original is on the left, untouched. The improved
                  example is fixed sample writing, not a personalised
                  rewrite.
                </p>
              </div>

              <div className={styles.comparisonGrid}>
                <article
                  className={styles.originalPanel}
                  aria-labelledby={originalTitleId}
                >
                  <div className={styles.panelTop}>
                    <div>
                      <p className={styles.panelKicker}>Your words</p>
                      <h3 id={originalTitleId} className={styles.panelTitle}>
                        Original draft
                      </h3>
                    </div>
                    <span className={styles.unchangedTag}>Unchanged</span>
                  </div>

                  <div className={styles.originalBody}>
                    <p className={styles.originalText}>{draft.speech}</p>
                  </div>

                  <footer className={styles.originalFooter}>
                    <span className={styles.footerItem}>
                      <FileText
                        size={14}
                        strokeWidth={1.8}
                        aria-hidden="true"
                      />
                      Shown exactly as entered
                    </span>
                    <span>
                      {wordCount} {wordLabel}
                    </span>
                  </footer>
                </article>

                <div className={styles.compareRail} aria-hidden="true">
                  <span className={styles.railLine} />
                  <span className={styles.railMarker}>
                    <ArrowRight size={16} strokeWidth={1.9} />
                  </span>
                  <span className={styles.railLine} />
                </div>

                <article
                  className={styles.improvedPanel}
                  aria-labelledby={improvedTitleId}
                >
                  <div className={styles.improvedHeader}>
                    <div className={styles.improvedIntro}>
                      <span className={styles.illustrativeBadge}>
                        <FlaskConical
                          size={13}
                          strokeWidth={1.9}
                          aria-hidden="true"
                        />
                        Illustrative sample
                      </span>
                      <h3
                        id={improvedTitleId}
                        className={styles.panelTitle}
                      >
                        Improved example
                      </h3>
                      <p className={styles.panelDescription}>
                        {IMPROVED_EXAMPLE_NOTE}
                      </p>
                    </div>

                    <div className={styles.copyArea}>
                      <button
                        type="button"
                        className={styles.copyButton}
                        onClick={copyImprovedExample}
                        disabled={isCopying}
                        aria-busy={isCopying}
                        aria-describedby={
                          copyFeedback ? copyFeedbackId : undefined
                        }
                      >
                        <Copy
                          size={16}
                          strokeWidth={2}
                          aria-hidden="true"
                        />
                        <span>Copy improved example</span>
                      </button>

                      <p
                        id={copyFeedbackId}
                        className={styles.copyFeedback}
                        role="status"
                        aria-live="polite"
                        aria-atomic="true"
                        data-tone={
                          copyStatus === 'success' ? 'success' : 'error'
                        }
                      >
                        {copyFeedback ? (
                          <>
                            {copyStatus === 'success' ? (
                              <Check
                                size={15}
                                strokeWidth={2.2}
                                aria-hidden="true"
                              />
                            ) : (
                              <AlertCircle
                                size={15}
                                strokeWidth={2}
                                aria-hidden="true"
                              />
                            )}
                            <span>{copyFeedback}</span>
                          </>
                        ) : null}
                      </p>
                    </div>
                  </div>

                  <div className={styles.improvedBody}>
                    <p className={styles.exampleSpeechTitle}>
                      {sampleRevision.improvedSpeech.title}
                    </p>
                    <div className={styles.improvedText}>
                      {sampleRevision.improvedSpeech.paragraphs.map(
                        (paragraph, index) => (
                          <p key={`paragraph-${index}`}>{paragraph}</p>
                        ),
                      )}
                    </div>
                  </div>

                  <footer className={styles.improvedFooter}>
                    <span className={styles.footerItem}>
                      <FileText
                        size={14}
                        strokeWidth={1.8}
                        aria-hidden="true"
                      />
                      Sample content · {improvedWordCount} words
                    </span>
                    <span>Your draft is not changed.</span>
                  </footer>
                </article>
              </div>
            </section>

            <section
              className={styles.changesSection}
              aria-labelledby={changesTitleId}
            >
              <div className={styles.sectionHeader}>
                <div>
                  <p className={styles.eyebrow}>Three illustrative moves</p>
                  <h2 id={changesTitleId} className={styles.sectionTitle}>
                    What a revision can improve
                  </h2>
                </div>
                <p className={styles.sectionLedger}>
                  Sample before-and-after lines from the demonstration
                  fixture. They are not edits made to your draft.
                </p>
              </div>

              <ol className={styles.changeList}>
                {sampleRevision.changes.map((change, index) => (
                  <li key={change.id} className={styles.changeItem}>
                    <span className={styles.changeIndex} aria-hidden="true">
                      {formatIndex(index)}
                    </span>

                    <div className={styles.changeBody}>
                      <div className={styles.changePair}>
                        <div
                          className={`${styles.changeSentence} ${styles.changeBefore}`}
                        >
                          <p className={styles.changeLabel}>
                            Original example
                          </p>
                          <p className={styles.changeText}>
                            {change.originalExample}
                          </p>
                        </div>

                        <ArrowRight
                          className={styles.changeArrow}
                          size={17}
                          strokeWidth={1.8}
                          aria-hidden="true"
                        />

                        <div
                          className={`${styles.changeSentence} ${styles.changeAfter}`}
                        >
                          <p className={styles.changeLabel}>
                            <Check
                              size={13}
                              strokeWidth={2.3}
                              aria-hidden="true"
                            />
                            Improved example
                          </p>
                          <p className={styles.changeText}>
                            {change.improvedExample}
                          </p>
                        </div>
                      </div>

                      <div className={styles.changeReason}>
                        <p className={styles.reasonLabel}>
                          Why it may work better
                        </p>
                        <p className={styles.reasonText}>
                          {change.explanation}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            <section
              className={styles.nextStep}
              aria-labelledby={nextTitleId}
            >
              <div className={styles.nextCopy}>
                <p className={styles.eyebrow}>Continue the pass</p>
                <h2 id={nextTitleId} className={styles.nextTitle}>
                  Keep your voice. Try one move.
                </h2>
                <p className={styles.nextText}>
                  Your draft is unchanged. Return to the workspace to try one
                  of these illustrative moves in your own words, then compare
                  the result by ear.
                </p>
              </div>
              <div className={styles.nextActions}>
                <ActionLink to="#/workspace" size="lg">
                  Edit your draft
                </ActionLink>
                <ActionLink
                  to="#/analysis"
                  variant="secondary"
                  size="lg"
                >
                  Back to analysis
                </ActionLink>
                <a href="#/" className={styles.textLink}>
                  Back to landing page
                </a>
              </div>
            </section>
          </div>
        )}
      </div>
    </section>
  );
}
