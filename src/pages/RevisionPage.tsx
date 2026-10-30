import { useEffect, useId, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Check,
  Copy,
  FileText,
  FlaskConical,
  LoaderCircle,
  PenLine,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { ActionLink } from '../components/ui/ActionLink';
import { WorkflowIntro } from '../components/workspace/WorkflowIntro';
import {
  type ApiFailure,
  type RevisionChangeResult,
  type SpeechRevisionResult,
} from '../lib/aiApi';
import { loadRevision } from '../lib/aiClient';
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
  MIN_SPEECH_WORDS,
  type SpeechDraft,
} from '../lib/speechDraft';
import styles from './RevisionPage.module.css';

interface RevisionPageProps {
  draft: SpeechDraft;
}

interface RevisionView {
  improvedSpeech: {
    title: string;
    paragraphs: string[];
  };
  changes: RevisionChangeResult[];
}

type RequestState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; revision: SpeechRevisionResult }
  | { status: 'error'; failure: ApiFailure };

type CopyStatus = 'idle' | 'copying' | 'success' | 'error' | 'unavailable';

const sampleRevisionView: RevisionView = {
  improvedSpeech: {
    title: sampleRevision.improvedSpeech.title,
    paragraphs: [...sampleRevision.improvedSpeech.paragraphs],
  },
  changes: [...sampleRevision.changes],
};

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

  const wordCount = countWords(draft.speech);
  const wordLabel = wordCount === 1 ? 'word' : 'words';
  const meetsMinimum = wordCount >= MIN_SPEECH_WORDS;
  const displayTitle = draft.title.trim() || 'Untitled speech';

  const [requestState, setRequestState] = useState<RequestState>({
    status: 'idle',
  });
  const [reloadKey, setReloadKey] = useState(0);
  const [showSampleFallback, setShowSampleFallback] = useState(false);
  const [copyStatus, setCopyStatus] = useState<CopyStatus>('idle');

  useEffect(() => {
    if (!meetsMinimum) {
      setRequestState({ status: 'idle' });
      setShowSampleFallback(false);
      return;
    }

    let active = true;
    setRequestState({ status: 'loading' });
    setShowSampleFallback(false);
    setCopyStatus('idle');

    loadRevision(draft, { force: reloadKey > 0 }).then((result) => {
      if (!active) {
        return;
      }

      setRequestState(
        result.ok
          ? { status: 'ready', revision: result.value }
          : { status: 'error', failure: result.failure },
      );
    });

    return () => {
      active = false;
    };
  }, [draft, meetsMinimum, reloadKey]);

  const readyRevision =
    requestState.status === 'ready' ? requestState.revision : null;
  const failure =
    requestState.status === 'error' ? requestState.failure : null;
  const isLive = readyRevision !== null;
  const isFallback =
    failure !== null && showSampleFallback && failure.fallbackAllowed;

  const activeRevision: RevisionView | null = readyRevision
    ? {
        improvedSpeech: {
          title: readyRevision.improvedSpeech.title,
          paragraphs: readyRevision.improvedSpeech.paragraphs,
        },
        changes: readyRevision.changes,
      }
    : isFallback
      ? sampleRevisionView
      : null;

  const improvedText = activeRevision
    ? activeRevision.improvedSpeech.paragraphs.join('\n\n')
    : '';
  const improvedWordCount = countWords(improvedText);
  const improvedWordLabel = improvedWordCount === 1 ? 'word' : 'words';
  const isCopying = copyStatus === 'copying';

  const copyFeedback =
    copyStatus === 'success'
      ? isLive
        ? 'Revised speech copied to your clipboard.'
        : 'Improved example copied to your clipboard.'
      : copyStatus === 'error'
        ? 'That copy didn’t work. Select the text above and copy it manually.'
        : copyStatus === 'unavailable'
          ? 'Clipboard access isn’t available here. Select the text above and copy it manually.'
          : '';

  function retryRevision() {
    setShowSampleFallback(false);
    setReloadKey((key) => key + 1);
  }

  async function copyImprovedExample() {
    if (!improvedText) {
      setCopyStatus('error');
      return;
    }

    setCopyStatus('copying');

    try {
      const clipboard = navigator.clipboard;

      if (!clipboard?.writeText) {
        setCopyStatus('unavailable');
        return;
      }

      await clipboard.writeText(improvedText);
      setCopyStatus('success');
    } catch {
      setCopyStatus('error');
    }
  }

  const statusMessage = !meetsMinimum
    ? `No valid draft is loaded. The workspace needs at least ${MIN_SPEECH_WORDS} words.`
    : requestState.status === 'loading'
      ? 'Generating an AI revision of your speech.'
      : requestState.status === 'error'
        ? showSampleFallback
          ? 'AI revision is unavailable. Showing fixed sample revision as a fallback.'
          : `The live revision could not be completed. ${requestState.failure.message}`
        : 'Live AI revision ready.';

  const introDescription = isLive
    ? 'Revision gives you room to sharpen clarity, steady the flow, and strengthen your impact. The comparison below was generated by the AI model from your draft.'
    : isFallback
      ? 'The AI revision could not be completed, so this page is showing a fixed demonstration. It is not a rewrite of your words.'
      : 'Revision gives you room to sharpen clarity, steady the flow, and strengthen your impact. Your draft is sent to the server for an AI revision when this page opens.';

  return (
    <section className={styles.page} aria-labelledby={pageTitleId}>
      <div className="container">
        <p className="visually-hidden" role="status" aria-atomic="true">
          {statusMessage}
        </p>

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
          description={introDescription}
          currentStep="refine"
        />

        {!meetsMinimum ? (
          <div className={styles.emptyPanel}>
            <div className={styles.emptyTop}>
              <span className={styles.stateLabel}>Draft needed</span>
              <span className={styles.fixtureFlag}>
                {wordCount === 0
                  ? 'No comparison without a draft'
                  : 'At least 50 words required'}
              </span>
            </div>

            <div className={styles.emptyContent}>
              <span className={styles.emptyIcon} aria-hidden="true">
                <PenLine size={24} strokeWidth={1.7} />
              </span>
              <div className={styles.emptyBody}>
                <p className={styles.stateLabel}>Draft needed</p>
                <h2 className={styles.emptyTitle}>
                  {wordCount === 0
                    ? 'There’s nothing to revise yet.'
                    : 'Add a little more before revising.'}
                </h2>
                <p className={styles.emptyText}>
                  {wordCount === 0
                    ? 'Write or paste your speech in the workspace, then return to this step. Your original wording stays intact, and no comparison is shown until there is a draft to revise.'
                    : `The live AI revision needs at least ${MIN_SPEECH_WORDS} words so there is enough to work with. Add a little more in the workspace, then return to this step.`}
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
                  Current draft length: {wordCount} {wordLabel}
                  {wordCount < MIN_SPEECH_WORDS
                    ? ` of ${MIN_SPEECH_WORDS} words minimum`
                    : ''}
                </p>
              </div>
            </div>
          </div>
        ) : requestState.status === 'loading' ||
          requestState.status === 'idle' ? (
          <div className={styles.loadingPanel} aria-busy="true">
            <div className={styles.loadingTop}>
              <span className={styles.liveBadge}>
                <Sparkles
                  size={14}
                  strokeWidth={1.9}
                  aria-hidden="true"
                />
                Live AI revision
              </span>
              <span className={styles.loadingStatus}>
                <LoaderCircle
                  className={styles.spinner}
                  size={15}
                  strokeWidth={2}
                  aria-hidden="true"
                />
                Revising
              </span>
            </div>

            <div className={styles.loadingCopy}>
              <p className={styles.stateLabel}>Step 3 · live AI</p>
              <h2 className={styles.loadingTitle}>
                Rewriting with your draft in view.
              </h2>
              <p className={styles.loadingText}>
                The configured AI model is preparing a full revision and a
                short list of changes. Your original draft stays exactly as
                you wrote it on the left.
              </p>
            </div>

            <div className={styles.loadingBar} aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </div>
          </div>
        ) : failure && !showSampleFallback ? (
          <div className={styles.emptyPanel}>
            <div className={styles.emptyTop}>
              <span className={styles.stateLabel}>Live AI revision</span>
              <span className={styles.fixtureFlag}>
                Your draft is unchanged
              </span>
            </div>

            <div className={styles.emptyContent}>
              <span
                className={`${styles.emptyIcon} ${styles.errorIcon}`}
                aria-hidden="true"
              >
                <AlertCircle size={24} strokeWidth={1.8} />
              </span>
              <div className={styles.emptyBody}>
                <p className={styles.stateLabel}>Revision unavailable</p>
                <h2 className={styles.emptyTitle}>
                  {failure.retryable
                    ? 'The revision didn’t come back.'
                    : 'Live revision isn’t available right now.'}
                </h2>
                <p className={styles.emptyText} role="alert">
                  {failure.message}
                </p>
                <div className={styles.emptyActions}>
                  {failure.retryable ? (
                    <button
                      type="button"
                      className={styles.errorRetry}
                      onClick={retryRevision}
                    >
                      <RotateCcw
                        size={15}
                        strokeWidth={2.2}
                        aria-hidden="true"
                      />
                      Retry revision
                    </button>
                  ) : null}
                  {failure.fallbackAllowed ? (
                    <button
                      type="button"
                      className={styles.fallbackButton}
                      onClick={() => setShowSampleFallback(true)}
                    >
                      <FlaskConical
                        size={15}
                        strokeWidth={1.9}
                        aria-hidden="true"
                      />
                      Show sample fallback
                    </button>
                  ) : null}
                  <ActionLink
                    to="#/workspace"
                    variant="secondary"
                    size="lg"
                  >
                    Back to workspace
                  </ActionLink>
                </div>
                <p className={styles.emptyCount}>
                  {failure.fallbackAllowed
                    ? 'The sample fallback is fixed demonstration content. It is never presented as a real rewrite.'
                    : 'No sample revision is shown for this error.'}
                </p>
              </div>
            </div>
          </div>
        ) : activeRevision ? (
          <div className={styles.revision}>
            {isFallback && failure ? (
              <div className={styles.fallbackBanner} role="status">
                <div className={styles.fallbackLead}>
                  <span className={styles.sampleBadge}>
                    <FlaskConical
                      size={14}
                      strokeWidth={1.9}
                      aria-hidden="true"
                    />
                    {SAMPLE_REVISION_LABEL}
                  </span>
                  <p className={styles.fallbackTitle}>
                    AI unavailable — showing sample data
                  </p>
                  <p className={styles.fallbackText}>
                    {failure.message} The comparison and change notes below
                    are fixed demonstration content, not a rewrite of your
                    speech.
                  </p>
                </div>
                <button
                  type="button"
                  className={styles.errorRetry}
                  onClick={retryRevision}
                >
                  <RotateCcw
                    size={15}
                    strokeWidth={2.2}
                    aria-hidden="true"
                  />
                  Try AI again
                </button>
              </div>
            ) : null}

            <header className={styles.overview}>
              <div className={styles.overviewTop}>
                {isLive ? (
                  <span className={styles.liveBadge}>
                    <Sparkles
                      size={14}
                      strokeWidth={1.9}
                      aria-hidden="true"
                    />
                    Live AI revision
                  </span>
                ) : (
                  <span className={styles.sampleBadge}>
                    <FlaskConical
                      size={14}
                      strokeWidth={1.9}
                      aria-hidden="true"
                    />
                    {SAMPLE_REVISION_LABEL}
                  </span>
                )}
                <span className={styles.fixtureFlag}>
                  {isLive
                    ? 'Generated by AI · your draft unchanged'
                    : 'Sample fallback · AI unavailable'}
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

              <p className={styles.overviewNote}>
                {isLive
                  ? 'The improved speech and change notes were generated by the AI model from your draft. AI revisions can shift your meaning, so review every line before you use it.'
                  : SAMPLE_REVISION_NOTE}
              </p>
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
                  {isLive
                    ? 'Your original is on the left, untouched. The right side is the AI revision generated from it.'
                    : 'Your original is on the left, untouched. The improved example is fixed sample writing, not a personalised rewrite.'}
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
                        {isLive ? (
                          <Sparkles
                            size={13}
                            strokeWidth={1.9}
                            aria-hidden="true"
                          />
                        ) : (
                          <FlaskConical
                            size={13}
                            strokeWidth={1.9}
                            aria-hidden="true"
                          />
                        )}
                        {isLive ? 'AI revision' : 'Illustrative sample'}
                      </span>
                      <h3
                        id={improvedTitleId}
                        className={styles.panelTitle}
                      >
                        {isLive ? 'AI revision' : 'Improved example'}
                      </h3>
                      <p className={styles.panelDescription}>
                        {isLive
                          ? 'A full revision generated by the AI model from your draft. Compare it line by line; AI can change your meaning.'
                          : IMPROVED_EXAMPLE_NOTE}
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
                        <span>
                          {isLive
                            ? 'Copy revised speech'
                            : 'Copy improved example'}
                        </span>
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
                      {activeRevision.improvedSpeech.title}
                    </p>
                    <div className={styles.improvedText}>
                      {activeRevision.improvedSpeech.paragraphs.map(
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
                      {isLive
                        ? `AI-generated · ${improvedWordCount} ${improvedWordLabel}`
                        : `Sample content · ${improvedWordCount} ${improvedWordLabel}`}
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
                  <p className={styles.eyebrow}>
                    {isLive
                      ? `${activeRevision.changes.length} key ${
                          activeRevision.changes.length === 1
                            ? 'change'
                            : 'changes'
                        }`
                      : 'Three illustrative moves'}
                  </p>
                  <h2 id={changesTitleId} className={styles.sectionTitle}>
                    What a revision can improve
                  </h2>
                </div>
                <p className={styles.sectionLedger}>
                  {isLive
                    ? 'Before-and-after lines quoted from your draft and the AI revision.'
                    : 'Sample before-and-after lines from the demonstration fixture. They are not edits made to your draft.'}
                </p>
              </div>

              <ol className={styles.changeList}>
                {activeRevision.changes.map((change, index) => (
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
                            {isLive ? 'Your original' : 'Original example'}
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
                            {isLive ? 'AI revision' : 'Improved example'}
                          </p>
                          <p className={styles.changeText}>
                            {change.improvedExample}
                          </p>
                        </div>
                      </div>

                      <div className={styles.changeReason}>
                        <p className={styles.reasonLabel}>
                          {isLive
                            ? 'Why this change helps'
                            : 'Why it may work better'}
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
                  {isLive
                    ? 'Your draft is unchanged. Copy the revision, keep the lines that sound like you, and leave the rest. Return to the workspace to compare the result by ear.'
                    : 'Your draft is unchanged. Return to the workspace to try one of these illustrative moves in your own words, then compare the result by ear.'}
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
        ) : null}
      </div>
    </section>
  );
}
