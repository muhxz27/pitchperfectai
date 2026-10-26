import { useEffect, useId, useRef, useState } from 'react';
import {
  AlertCircle,
  Check,
  FileText,
  FlaskConical,
  LoaderCircle,
  Mail,
  RotateCcw,
  Target,
} from 'lucide-react';
import { ActionLink } from '../components/ui/ActionLink';
import { WorkflowIntro } from '../components/workspace/WorkflowIntro';
import {
  SAMPLE_ANALYSIS_LABEL,
  SAMPLE_ANALYSIS_NOTE,
  sampleAnalysis,
  type AnalysisDimensionId,
} from '../lib/analysisSample';
import {
  buildSampleReport,
  getWebhookConfig,
  sendSampleReport,
} from '../lib/reportWebhook';
import {
  countWords,
  getAudienceLabel,
  getGoalLabel,
  MIN_SPEECH_WORDS,
  type SpeechDraft,
} from '../lib/speechDraft';
import styles from './AnalysisPage.module.css';

interface AnalysisPageProps {
  draft: SpeechDraft;
}

const PREPARATION_DELAY_MS = 700;
const SCORE_MAX = 10;
const SCORE_SEGMENTS = Array.from({ length: SCORE_MAX }, (_, index) => index);

type DeliveryStatus = 'idle' | 'sending' | 'success' | 'error';

function formatIndex(index: number) {
  return String(index + 1).padStart(2, '0');
}

function getDimensionName(dimensionId: AnalysisDimensionId) {
  return (
    sampleAnalysis.dimensions.find(
      (dimension) => dimension.id === dimensionId,
    )?.name ?? 'Sample dimension'
  );
}

export function AnalysisPage({ draft }: AnalysisPageProps) {
  const id = useId();
  const pageTitleId = `${id}-title`;
  const dimensionsTitleId = `${id}-dimensions`;
  const priorityTitleId = `${id}-priority`;
  const strengthsTitleId = `${id}-strengths`;
  const feedbackTitleId = `${id}-feedback`;
  const tipsTitleId = `${id}-tips`;
  const nextTitleId = `${id}-next`;
  const reportTitleId = `${id}-report`;
  const reportDescriptionId = `${id}-report-description`;
  const reportConfigId = `${id}-report-config`;

  const wordCount = countWords(draft.speech);
  const meetsMinimum = wordCount >= MIN_SPEECH_WORDS;
  const displayTitle = draft.title.trim() || 'Untitled speech';
  const wordLabel = wordCount === 1 ? 'word' : 'words';
  const [isPreparing, setIsPreparing] = useState(meetsMinimum);
  const [sendState, setSendState] = useState<DeliveryStatus>('idle');
  const [sendMessage, setSendMessage] = useState('');
  const sendInFlight = useRef(false);

  const webhookConfig = getWebhookConfig();
  const sampleReport = buildSampleReport(draft);
  const isSending = sendState === 'sending';
  const reportDescribedBy =
    webhookConfig.state === 'ready'
      ? reportDescriptionId
      : `${reportDescriptionId} ${reportConfigId}`;

  useEffect(() => {
    if (!meetsMinimum) {
      setIsPreparing(false);
      return;
    }

    setIsPreparing(true);
    const timer = window.setTimeout(() => {
      setIsPreparing(false);
    }, PREPARATION_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [meetsMinimum]);

  async function handleSendReport() {
    if (sendInFlight.current) {
      return;
    }

    const currentReport = buildSampleReport(draft);

    if (!currentReport) {
      setSendState('error');
      setSendMessage(
        'The sample report isn’t available for this draft. Return to the workspace, check the draft, and try again.',
      );
      return;
    }

    const config = getWebhookConfig();

    if (config.state !== 'ready') {
      setSendState('error');
      setSendMessage(config.message);
      return;
    }

    sendInFlight.current = true;
    setSendState('sending');
    setSendMessage(
      'Sending the demonstration report to the configured webhook…',
    );

    try {
      const result = await sendSampleReport(config.url, currentReport);

      if (result.ok) {
        setSendState('success');
        setSendMessage(
          `The webhook accepted the demonstration report (HTTP ${result.status}). Your Make.com scenario sends the email, so inbox delivery isn’t confirmed by this page.`,
        );
        return;
      }

      setSendState('error');
      setSendMessage(result.message);
    } catch {
      setSendState('error');
      setSendMessage(
        'Sending the report stopped unexpectedly. Nothing was confirmed as sent. Try again.',
      );
    } finally {
      sendInFlight.current = false;
    }
  }

  const statusMessage = !meetsMinimum
    ? `No valid draft is loaded. The workspace needs at least ${MIN_SPEECH_WORDS} words.`
    : isPreparing
      ? 'Preparing the sample analysis.'
      : 'Sample analysis dashboard ready. All results are demonstration data.';

  return (
    <section className={styles.page} aria-labelledby={pageTitleId}>
      <div className="container">
        <p className="visually-hidden" role="status">
          {statusMessage}
        </p>

        <WorkflowIntro
          backHref="#/workspace"
          backLabel="Back to workspace"
          eyebrow="Analysis · Step 2 of 3"
          title={
            <>
              Your speech <em>analysis</em>
            </>
          }
          titleId={pageTitleId}
          description="A fixed demonstration review, arranged the way the finished analysis will be. Your draft is carried through for context — these scores and notes are sample content, not an assessment of your speech."
          currentStep="analyse"
        />

        {!meetsMinimum ? (
          <div className={styles.emptyPanel}>
            <span className={styles.emptyIcon} aria-hidden="true">
              <FileText size={24} strokeWidth={1.7} />
            </span>
            <div className={styles.emptyBody}>
              <p className={styles.stateLabel}>Draft needed</p>
              <h2 className={styles.emptyTitle}>
                There’s no speech to review yet.
              </h2>
              <p className={styles.emptyText}>
                Write or paste at least {MIN_SPEECH_WORDS} words in the
                workspace, then return to this step. The review is fixed
                demonstration content, and this page opens only when your
                draft meets the minimum.
              </p>
              <div className={styles.emptyActions}>
                <ActionLink to="#/workspace" size="lg">
                  Go to workspace
                </ActionLink>
                <a href="#/" className={styles.textLink}>
                  Back to overview
                </a>
              </div>
              <p className={styles.emptyCount}>
                Current draft length: {wordCount} of {MIN_SPEECH_WORDS}{' '}
                words minimum
              </p>
            </div>
          </div>
        ) : isPreparing ? (
          <div className={styles.loadingPanel} aria-busy="true">
            <div className={styles.loadingTop}>
              <span className={styles.sampleBadge}>
                <FlaskConical
                  size={14}
                  strokeWidth={1.9}
                  aria-hidden="true"
                />
                {SAMPLE_ANALYSIS_LABEL}
              </span>
              <span className={styles.loadingStatus}>
                <LoaderCircle
                  className={styles.spinner}
                  size={15}
                  strokeWidth={2}
                  aria-hidden="true"
                />
                Preparing sample
              </span>
            </div>

            <div className={styles.loadingCopy}>
              <p className={styles.stateLabel}>Step 2 · demonstration</p>
              <h2 className={styles.loadingTitle}>
                Laying out the sample review.
              </h2>
              <p className={styles.loadingText}>
                No AI call is running and your draft is not being assessed.
                The fixed demonstration data will appear in a moment.
              </p>
            </div>

            <div className={styles.loadingSkeleton} aria-hidden="true">
              {SCORE_SEGMENTS.slice(0, 5).map((segment) => (
                <div key={segment} className={styles.skeletonRow}>
                  <span className={styles.skeletonNumber} />
                  <span className={styles.skeletonText} />
                  <span className={styles.skeletonScore} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className={styles.dashboard}>
            <section
              className={styles.reportPanel}
              aria-labelledby={reportTitleId}
            >
              <div className={styles.reportLead}>
                <span className={styles.reportIcon} aria-hidden="true">
                  <Mail size={21} strokeWidth={1.8} />
                </span>
                <div className={styles.reportCopy}>
                  <p className={styles.reportTag}>
                    <FlaskConical
                      size={13}
                      strokeWidth={1.9}
                      aria-hidden="true"
                    />
                    Demonstration report
                  </p>
                  <h2 id={reportTitleId} className={styles.reportTitle}>
                    Send this sample report to your email.
                  </h2>
                  <p id={reportDescriptionId} className={styles.reportText}>
                    Includes the speech title, audience, goal, word count,
                    the five sample scores, and the sample priority focus.
                    Your speech text is never included.
                  </p>
                  <p className={styles.reportNote}>
                    The endpoint is read from{' '}
                    <code>VITE_MAKE_WEBHOOK_URL</code>. Vite exposes it to
                    the browser, so use only a limited demonstration
                    webhook — not a secret.
                  </p>
                </div>
              </div>

              <div className={styles.reportAction}>
                {webhookConfig.state !== 'ready' ? (
                  <p id={reportConfigId} className={styles.reportConfig}>
                    <AlertCircle
                      size={15}
                      strokeWidth={1.9}
                      aria-hidden="true"
                    />
                    <span>{webhookConfig.message}</span>
                  </p>
                ) : null}

                <button
                  type="button"
                  className={styles.reportButton}
                  onClick={handleSendReport}
                  disabled={
                    isSending ||
                    webhookConfig.state !== 'ready' ||
                    !sampleReport
                  }
                  aria-busy={isSending}
                  aria-describedby={reportDescribedBy}
                >
                  {isSending ? (
                    <LoaderCircle
                      className={styles.spinner}
                      size={17}
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                  ) : (
                    <Mail size={17} strokeWidth={2} aria-hidden="true" />
                  )}
                  <span>Send report to my email</span>
                </button>

                <div
                  className={styles.reportFeedback}
                  data-tone={
                    sendState === 'success'
                      ? 'success'
                      : sendState === 'error'
                        ? 'error'
                        : sendState === 'sending'
                          ? 'sending'
                          : undefined
                  }
                  role={sendState === 'error' ? 'alert' : 'status'}
                  aria-live={sendState === 'error' ? 'assertive' : 'polite'}
                  aria-atomic="true"
                >
                  {sendMessage ? (
                    <>
                      <span
                        className={styles.reportFeedbackIcon}
                        aria-hidden="true"
                      >
                        {sendState === 'success' ? (
                          <Check size={15} strokeWidth={2.2} />
                        ) : sendState === 'error' ? (
                          <AlertCircle size={15} strokeWidth={2} />
                        ) : (
                          <LoaderCircle
                            className={styles.spinner}
                            size={15}
                            strokeWidth={2}
                          />
                        )}
                      </span>
                      <p className={styles.reportFeedbackText}>
                        {sendMessage}
                      </p>
                      {sendState === 'error' &&
                      webhookConfig.state === 'ready' &&
                      sampleReport ? (
                        <button
                          type="button"
                          className={styles.retryButton}
                          onClick={handleSendReport}
                        >
                          <RotateCcw
                            size={13}
                            strokeWidth={2}
                            aria-hidden="true"
                          />
                          Try again
                        </button>
                      ) : null}
                    </>
                  ) : null}
                </div>
              </div>
            </section>

            <header className={styles.overview}>
              <div className={styles.overviewTop}>
                <span className={styles.sampleBadge}>
                  <FlaskConical
                    size={14}
                    strokeWidth={1.9}
                    aria-hidden="true"
                  />
                  {SAMPLE_ANALYSIS_LABEL}
                </span>
                <span className={styles.fixtureFlag}>
                  Fixed fixture · no live AI
                </span>
              </div>

              <div className={styles.overviewMain}>
                <div className={styles.overviewCopy}>
                  <p className={styles.overviewEyebrow}>
                    Your draft, shown for context
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
                  <ActionLink to="#/revision" size="lg">
                    Improve my speech
                  </ActionLink>
                  <a href="#/workspace" className={styles.textLink}>
                    Edit your draft
                  </a>
                </div>
              </div>

              <p className={styles.overviewNote}>{SAMPLE_ANALYSIS_NOTE}</p>
            </header>

            <div className={styles.reviewLayout}>
              <section
                className={styles.dimensionsPanel}
                aria-labelledby={dimensionsTitleId}
              >
                <div className={styles.panelHeader}>
                  <div>
                    <p className={styles.eyebrow}>Five dimensions</p>
                    <h2 id={dimensionsTitleId} className={styles.sectionTitle}>
                      How the sample performs.
                    </h2>
                  </div>
                  <p className={styles.panelNote}>
                    Fixed 0–{SCORE_MAX} sample scores
                  </p>
                </div>

                <ol className={styles.dimensionList}>
                  {sampleAnalysis.dimensions.map((dimension, index) => (
                    <li key={dimension.id} className={styles.dimension}>
                      <span
                        className={styles.dimensionIndex}
                        aria-hidden="true"
                      >
                        {formatIndex(index)}
                      </span>

                      <div className={styles.dimensionCopy}>
                        <h3 className={styles.dimensionName}>
                          {dimension.name}
                        </h3>
                        <p className={styles.dimensionExplanation}>
                          {dimension.explanation}
                        </p>
                      </div>

                      <div className={styles.dimensionMeta}>
                        <p className={styles.dimensionScore}>
                          <span className={styles.scoreValue}>
                            {dimension.score}
                          </span>
                          <span className={styles.scoreScale}>
                            / {SCORE_MAX}
                          </span>
                        </p>
                        <span
                          className={styles.status}
                          data-status={dimension.status.toLowerCase()}
                        >
                          <span
                            className={styles.statusDot}
                            aria-hidden="true"
                          />
                          {dimension.status}
                        </span>
                      </div>

                      <div
                        className={styles.dimensionProgress}
                        role="progressbar"
                        aria-label={`${dimension.name} score`}
                        aria-valuemin={0}
                        aria-valuemax={SCORE_MAX}
                        aria-valuenow={dimension.score}
                        aria-valuetext={`${dimension.score} out of ${SCORE_MAX} — ${dimension.status}`}
                        data-status={dimension.status.toLowerCase()}
                      >
                        {SCORE_SEGMENTS.map((segment) => (
                          <span
                            key={segment}
                            className={styles.progressSegment}
                            data-filled={
                              segment < dimension.score ? 'true' : 'false'
                            }
                            aria-hidden="true"
                          />
                        ))}
                      </div>
                    </li>
                  ))}
                </ol>

                <p className={styles.panelFootnote}>
                  Scores, statuses, and notes come from the fixed
                  demonstration fixture. None of this was generated from your
                  draft.
                </p>
              </section>

              <aside
                className={styles.priority}
                aria-labelledby={priorityTitleId}
              >
                <div className={styles.priorityTop}>
                  <p className={styles.priorityEyebrow}>
                    <Target size={14} strokeWidth={1.9} aria-hidden="true" />
                    Focus area ·{' '}
                    {getDimensionName(sampleAnalysis.priority.dimensionId)}
                  </p>
                  <span className={styles.priorityTag}>Sample</span>
                </div>

                <h2 id={priorityTitleId} className={styles.priorityTitle}>
                  Improve this first
                </h2>
                <p className={styles.priorityHeadline}>
                  {sampleAnalysis.priority.headline}
                </p>

                <div className={styles.priorityBlock}>
                  <p className={styles.priorityBlockLabel}>Why it matters</p>
                  <p className={styles.priorityText}>
                    {sampleAnalysis.priority.whyItMatters}
                  </p>
                </div>

                <div
                  className={`${styles.priorityBlock} ${styles.priorityNext}`}
                >
                  <p className={styles.priorityBlockLabel}>Try this next</p>
                  <p className={styles.priorityText}>
                    {sampleAnalysis.priority.nextAction}
                  </p>
                </div>

                <p className={styles.priorityNote}>
                  Illustrative priority from the demonstration fixture.
                </p>
              </aside>
            </div>

            <section
              className={styles.strengths}
              aria-labelledby={strengthsTitleId}
            >
              <div className={styles.sectionHeader}>
                <div>
                  <p className={styles.eyebrow}>Strengths</p>
                  <h2 id={strengthsTitleId} className={styles.sectionTitle}>
                    What the sample does well.
                  </h2>
                </div>
                <p className={styles.sectionLedger}>
                  Three examples from the fixed demonstration fixture. These
                  are not findings discovered in your speech.
                </p>
              </div>

              <ul className={styles.strengthGrid}>
                {sampleAnalysis.strengths.map((strength, index) => (
                  <li key={strength.id} className={styles.strengthItem}>
                    <div className={styles.itemTop}>
                      <span className={styles.itemNumber} aria-hidden="true">
                        {formatIndex(index)}
                      </span>
                      <span className={styles.dimensionPill}>
                        <span className="visually-hidden">
                          Related dimension:{' '}
                        </span>
                        {getDimensionName(strength.dimensionId)}
                      </span>
                    </div>
                    <p className={styles.exampleLabel}>Example strength</p>
                    <h3 className={styles.strengthTitle}>{strength.title}</h3>
                    <p className={styles.strengthText}>
                      {strength.explanation}
                    </p>
                  </li>
                ))}
              </ul>
            </section>

            <section
              className={styles.feedbackSection}
              aria-labelledby={feedbackTitleId}
            >
              <div className={styles.sectionHeader}>
                <div>
                  <p className={styles.eyebrow}>Line by line</p>
                  <h2 id={feedbackTitleId} className={styles.sectionTitle}>
                    Sentence-level feedback
                  </h2>
                </div>
                <p className={styles.sectionLedger}>
                  Example sentences written for the fixture. They are not
                  quotations from your draft.
                </p>
              </div>

              <ol className={styles.feedbackList}>
                {sampleAnalysis.sentenceFeedback.map((item, index) => (
                  <li key={item.id} className={styles.feedbackItem}>
                    <div className={styles.feedbackExample}>
                      <div className={styles.feedbackMeta}>
                        <span
                          className={styles.itemNumber}
                          aria-hidden="true"
                        >
                          {formatIndex(index)}
                        </span>
                        <span className={styles.dimensionPill}>
                          <span className="visually-hidden">
                            Related dimension:{' '}
                          </span>
                          {getDimensionName(item.dimensionId)}
                        </span>
                      </div>
                      <p className={styles.exampleLabel}>Example sentence</p>
                      <p className={styles.feedbackSentence}>
                        {item.exampleSentence}
                      </p>
                    </div>

                    <div className={styles.feedbackDetail}>
                      <div>
                        <p className={styles.detailLabel}>What to notice</p>
                        <p className={styles.issueText}>{item.issue}</p>
                      </div>
                      <div className={styles.revision}>
                        <p className={styles.revisionLabel}>
                          Suggested revision
                        </p>
                        <p className={styles.revisionText}>
                          {item.suggestedRevision}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            <section
              className={styles.deliveryPanel}
              aria-labelledby={tipsTitleId}
            >
              <div className={styles.sectionHeader}>
                <div>
                  <p className={styles.eyebrow}>
                    Delivery tips · general guidance
                  </p>
                  <h2 id={tipsTitleId} className={styles.sectionTitle}>
                    Three things to rehearse.
                  </h2>
                </div>
                <p className={styles.sectionLedger}>
                  Practical suggestions only. Nothing here comes from
                  listening to you or measuring your voice, pace, tone, or
                  body language.
                </p>
              </div>

              <ol className={styles.tipGrid}>
                {sampleAnalysis.deliveryTips.map((tip, index) => (
                  <li key={tip.id} className={styles.tipItem}>
                    <span className={styles.tipNumber} aria-hidden="true">
                      {formatIndex(index)}
                    </span>
                    <h3 className={styles.tipTitle}>{tip.title}</h3>
                    <p className={styles.tipText}>{tip.description}</p>
                  </li>
                ))}
              </ol>
            </section>

            <section
              className={styles.nextStep}
              aria-labelledby={nextTitleId}
            >
              <div className={styles.nextCopy}>
                <p className={styles.eyebrow}>Next step</p>
                <h2 id={nextTitleId} className={styles.nextTitle}>
                  Take the feedback into revision.
                </h2>
                <p className={styles.nextText}>
                  Your draft stays untouched in the workspace. The scores and
                  notes on this page remain sample content; the revision step
                  is where the next pass belongs.
                </p>
              </div>
              <div className={styles.nextActions}>
                <ActionLink to="#/revision" size="lg">
                  Improve my speech
                </ActionLink>
                <ActionLink
                  to="#/workspace"
                  variant="secondary"
                  size="lg"
                >
                  Back to workspace
                </ActionLink>
              </div>
            </section>
          </div>
        )}
      </div>
    </section>
  );
}
