import { useEffect, useId, useRef, useState } from 'react';
import {
  AlertCircle,
  Check,
  FileText,
  FlaskConical,
  LoaderCircle,
  Mail,
  RotateCcw,
  Sparkles,
  Target,
} from 'lucide-react';
import { ActionLink } from '../components/ui/ActionLink';
import { WorkflowIntro } from '../components/workspace/WorkflowIntro';
import {
  type AnalysisDimensionId,
  type AnalysisDimensionResult,
  type ApiFailure,
  type DeliveryTipResult,
  type SentenceFeedbackResult,
  type SpeechAnalysisResult,
  type StrengthResult,
  type PriorityImprovementResult,
} from '../lib/aiApi';
import { loadAnalysis } from '../lib/aiClient';
import {
  SAMPLE_ANALYSIS_LABEL,
  SAMPLE_ANALYSIS_NOTE,
  sampleAnalysis,
} from '../lib/analysisSample';
import {
  buildReport,
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

interface AnalysisView {
  dimensions: AnalysisDimensionResult[];
  priority: PriorityImprovementResult;
  strengths: StrengthResult[];
  sentenceFeedback: SentenceFeedbackResult[];
  deliveryTips: DeliveryTipResult[];
}

type RequestState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; analysis: SpeechAnalysisResult }
  | { status: 'error'; failure: ApiFailure };

type DeliveryStatus = 'idle' | 'sending' | 'success' | 'error';

const SCORE_MAX = 10;
const SCORE_SEGMENTS = Array.from({ length: SCORE_MAX }, (_, index) => index);

const sampleView: AnalysisView = {
  dimensions: [...sampleAnalysis.dimensions],
  priority: sampleAnalysis.priority,
  strengths: [...sampleAnalysis.strengths],
  sentenceFeedback: [...sampleAnalysis.sentenceFeedback],
  deliveryTips: [...sampleAnalysis.deliveryTips],
};

function formatIndex(index: number) {
  return String(index + 1).padStart(2, '0');
}

function getDimensionName(
  dimensions: readonly AnalysisDimensionResult[],
  dimensionId: AnalysisDimensionId,
) {
  return (
    dimensions.find((dimension) => dimension.id === dimensionId)?.name ??
    'Dimension'
  );
}

export function AnalysisPage({ draft }: AnalysisPageProps) {
  const id = useId();
  const pageTitleId = `${id}-title`;
  const dimensionsTitleId = `${id}-dimensions`;
  const priorityTitleId = `${id}-priority`;
  const strengthsTitleId = `${id}-strengths`;
  const weaknessesTitleId = `${id}-weaknesses`;
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

  const [requestState, setRequestState] = useState<RequestState>({
    status: 'idle',
  });
  const [reloadKey, setReloadKey] = useState(0);
  const [showSampleFallback, setShowSampleFallback] = useState(false);
  const [sendState, setSendState] = useState<DeliveryStatus>('idle');
  const [sendMessage, setSendMessage] = useState('');
  const sendInFlight = useRef(false);

  useEffect(() => {
    if (!meetsMinimum) {
      setRequestState({ status: 'idle' });
      setShowSampleFallback(false);
      return;
    }

    let active = true;
    setRequestState({ status: 'loading' });
    setShowSampleFallback(false);

    loadAnalysis(draft, { force: reloadKey > 0 }).then((result) => {
      if (!active) {
        return;
      }

      setRequestState(
        result.ok
          ? { status: 'ready', analysis: result.value }
          : { status: 'error', failure: result.failure },
      );
    });

    return () => {
      active = false;
    };
  }, [draft, meetsMinimum, reloadKey]);

  const readyAnalysis =
    requestState.status === 'ready' ? requestState.analysis : null;
  const failure =
    requestState.status === 'error' ? requestState.failure : null;
  const isLive = readyAnalysis !== null;
  const isFallback =
    failure !== null && showSampleFallback && failure.fallbackAllowed;

  const view: AnalysisView | null = readyAnalysis
    ? {
        dimensions: readyAnalysis.dimensions,
        priority: readyAnalysis.priorityImprovement,
        strengths: readyAnalysis.strengths,
        sentenceFeedback: readyAnalysis.sentenceFeedback,
        deliveryTips: readyAnalysis.deliveryTips,
      }
    : isFallback
      ? sampleView
      : null;

  const focusAreas = view
    ? view.dimensions.filter((dimension) => dimension.status !== 'Strong')
    : [];

  const emailReport = view
    ? buildReport(
        draft,
        { dimensions: view.dimensions, priority: view.priority },
        !isLive,
      )
    : null;

  const webhookConfig = getWebhookConfig();
  const isSending = sendState === 'sending';
  const reportDescribedBy =
    webhookConfig.state === 'ready'
      ? reportDescriptionId
      : `${reportDescriptionId} ${reportConfigId}`;

  function retryAnalysis() {
    setShowSampleFallback(false);
    setSendState('idle');
    setSendMessage('');
    setReloadKey((key) => key + 1);
  }

  async function handleSendReport() {
    if (sendInFlight.current) {
      return;
    }

    const currentReport = emailReport;

    if (!currentReport) {
      setSendState('error');
      setSendMessage(
        'A report isn’t ready for this draft yet. Wait for the analysis to finish, then try again.',
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
      isLive
        ? 'Sending your AI report to the configured webhook…'
        : 'Sending the demonstration report to the configured webhook…',
    );

    try {
      const result = await sendSampleReport(config.url, currentReport);

      if (result.ok) {
        setSendState('success');
        setSendMessage(
          `The webhook accepted the ${
            isLive ? 'AI report' : 'demonstration report'
          } (HTTP ${result.status}). Your Make.com scenario sends the email, so inbox delivery isn’t confirmed by this page.`,
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
    : requestState.status === 'loading'
      ? 'Analysing your speech with the AI model.'
      : requestState.status === 'error'
        ? showSampleFallback
          ? 'AI analysis is unavailable. Showing fixed sample analysis as a fallback.'
          : `The live analysis could not be completed. ${requestState.failure.message}`
        : 'Live AI analysis ready.';

  const introDescription = isLive
    ? 'This review was generated by the configured AI model from the draft you wrote. Treat the scores as a starting point, not a verdict.'
    : isFallback
      ? 'The AI analysis could not be completed, so this page is showing fixed demonstration data. These scores and notes do not describe your speech.'
      : 'Your draft is sent to the server for analysis by the configured AI model. The live review appears here when the model responds.';

  return (
    <section className={styles.page} aria-labelledby={pageTitleId}>
      <div className="container">
        <p className="visually-hidden" role="status" aria-atomic="true">
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
          description={introDescription}
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
                workspace, then return to this step. The live AI review runs
                as soon as the page opens with a valid draft.
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
                Live AI analysis
              </span>
              <span className={styles.loadingStatus}>
                <LoaderCircle
                  className={styles.spinner}
                  size={15}
                  strokeWidth={2}
                  aria-hidden="true"
                />
                Analysing
              </span>
            </div>

            <div className={styles.loadingCopy}>
              <p className={styles.stateLabel}>Step 2 · live AI</p>
              <h2 className={styles.loadingTitle}>Reading your draft.</h2>
              <p className={styles.loadingText}>
                Your draft is being analysed on the server by the configured
                AI model. This usually takes a few seconds; the full review
                appears here when it arrives.
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
        ) : failure && !showSampleFallback ? (
          <div className={styles.emptyPanel}>
            <div className={styles.emptyContent}>
              <span
                className={`${styles.emptyIcon} ${styles.errorIcon}`}
                aria-hidden="true"
              >
                <AlertCircle size={24} strokeWidth={1.8} />
              </span>
              <div className={styles.emptyBody}>
                <p className={styles.stateLabel}>Live AI analysis</p>
                <h2 className={styles.emptyTitle}>
                  {failure.retryable
                    ? 'The analysis didn’t come back.'
                    : 'Live analysis isn’t available right now.'}
                </h2>
                <p className={styles.emptyText} role="alert">
                  {failure.message}
                </p>
                <div className={styles.emptyActions}>
                  {failure.retryable ? (
                    <button
                      type="button"
                      className={styles.errorRetry}
                      onClick={retryAnalysis}
                    >
                      <RotateCcw
                        size={15}
                        strokeWidth={2.2}
                        aria-hidden="true"
                      />
                      Retry analysis
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
                    ? 'The sample fallback is fixed demonstration data. It is never presented as a real result.'
                    : 'No sample scores are shown for this error.'}
                </p>
              </div>
            </div>
          </div>
        ) : view ? (
          <div className={styles.dashboard}>
            {isFallback && failure ? (
              <div className={styles.fallbackBanner} role="status">
                <div className={styles.fallbackLead}>
                  <span className={styles.sampleBadge}>
                    <FlaskConical
                      size={14}
                      strokeWidth={1.9}
                      aria-hidden="true"
                    />
                    {SAMPLE_ANALYSIS_LABEL}
                  </span>
                  <p className={styles.fallbackTitle}>
                    AI unavailable — showing sample data
                  </p>
                  <p className={styles.fallbackText}>
                    {failure.message} The scores, strengths, and suggestions
                    below are fixed demonstration content, not results for
                    your speech.
                  </p>
                </div>
                <button
                  type="button"
                  className={styles.errorRetry}
                  onClick={retryAnalysis}
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
                    {isLive ? 'AI report' : 'Demonstration report'}
                  </p>
                  <h2 id={reportTitleId} className={styles.reportTitle}>
                    {isLive
                      ? 'Send this AI report to your email.'
                      : 'Send this sample report to your email.'}
                  </h2>
                  <p id={reportDescriptionId} className={styles.reportText}>
                    {isLive
                      ? 'Includes the speech title, audience, goal, word count, the five AI scores, and the AI priority focus. Your speech text is never included.'
                      : 'Includes the speech title, audience, goal, word count, the five sample scores, and the sample priority focus. Your speech text is never included.'}
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
                    !emailReport
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
                      emailReport ? (
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
                {isLive ? (
                  <span className={styles.liveBadge}>
                    <Sparkles
                      size={14}
                      strokeWidth={1.9}
                      aria-hidden="true"
                    />
                    Live AI analysis
                  </span>
                ) : (
                  <span className={styles.sampleBadge}>
                    <FlaskConical
                      size={14}
                      strokeWidth={1.9}
                      aria-hidden="true"
                    />
                    {SAMPLE_ANALYSIS_LABEL}
                  </span>
                )}
                <span className={styles.fixtureFlag}>
                  {isLive
                    ? 'Generated by AI from this draft'
                    : 'Sample fallback · AI unavailable'}
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

              <p className={styles.overviewNote}>
                {isLive
                  ? 'Scores, explanations, and suggestions were generated by the AI model from the draft above. AI feedback can miss context or be wrong; use your judgement.'
                  : SAMPLE_ANALYSIS_NOTE}
              </p>
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
                      {isLive
                        ? 'How your speech scores.'
                        : 'How the sample performs.'}
                    </h2>
                  </div>
                  <p className={styles.panelNote}>
                    {isLive
                      ? `Live AI scores · 0–${SCORE_MAX}`
                      : `Fixed 0–${SCORE_MAX} sample scores`}
                  </p>
                </div>

                <ol className={styles.dimensionList}>
                  {view.dimensions.map((dimension, index) => (
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
                  {isLive
                    ? 'Scores, statuses, and notes were generated by the AI model from your draft. Treat them as a starting point, not a verdict.'
                    : 'Scores, statuses, and notes come from the fixed demonstration fixture. None of this was generated from your draft.'}
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
                    {getDimensionName(
                      view.dimensions,
                      view.priority.dimensionId,
                    )}
                  </p>
                  <span className={styles.priorityTag}>
                    {isLive ? 'AI focus' : 'Sample'}
                  </span>
                </div>

                <h2 id={priorityTitleId} className={styles.priorityTitle}>
                  Improve this first
                </h2>
                <p className={styles.priorityHeadline}>
                  {view.priority.headline}
                </p>

                <div className={styles.priorityBlock}>
                  <p className={styles.priorityBlockLabel}>Why it matters</p>
                  <p className={styles.priorityText}>
                    {view.priority.whyItMatters}
                  </p>
                </div>

                <div
                  className={`${styles.priorityBlock} ${styles.priorityNext}`}
                >
                  <p className={styles.priorityBlockLabel}>Try this next</p>
                  <p className={styles.priorityText}>
                    {view.priority.nextAction}
                  </p>
                </div>

                <p className={styles.priorityNote}>
                  {isLive
                    ? 'Priority selected by the AI model from this draft.'
                    : 'Illustrative priority from the demonstration fixture.'}
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
                    {isLive
                      ? 'What your speech does well.'
                      : 'What the sample does well.'}
                  </h2>
                </div>
                <p className={styles.sectionLedger}>
                  {isLive
                    ? 'Strengths identified by the AI model in the draft above.'
                    : 'Three examples from the fixed demonstration fixture. These are not findings discovered in your speech.'}
                </p>
              </div>

              <ul className={styles.strengthGrid}>
                {view.strengths.map((strength, index) => (
                  <li key={strength.id} className={styles.strengthItem}>
                    <div className={styles.itemTop}>
                      <span className={styles.itemNumber} aria-hidden="true">
                        {formatIndex(index)}
                      </span>
                      <span className={styles.dimensionPill}>
                        <span className="visually-hidden">
                          Related dimension:{' '}
                        </span>
                        {getDimensionName(
                          view.dimensions,
                          strength.dimensionId,
                        )}
                      </span>
                    </div>
                    <p className={styles.exampleLabel}>
                      {isLive ? 'AI strength' : 'Example strength'}
                    </p>
                    <h3 className={styles.strengthTitle}>{strength.title}</h3>
                    <p className={styles.strengthText}>
                      {strength.explanation}
                    </p>
                  </li>
                ))}
              </ul>
            </section>

            {isLive ? (
              <section
                className={styles.strengths}
                aria-labelledby={weaknessesTitleId}
              >
                <div className={styles.sectionHeader}>
                  <div>
                    <p className={styles.eyebrow}>
                      Weaknesses · from the AI review
                    </p>
                    <h2
                      id={weaknessesTitleId}
                      className={styles.sectionTitle}
                    >
                      Where the draft needs work.
                    </h2>
                  </div>
                  <p className={styles.sectionLedger}>
                    Dimensions the AI model scored below Strong. Pair these
                    with the priority focus above.
                  </p>
                </div>

                {focusAreas.length > 0 ? (
                  <ul className={styles.strengthGrid}>
                    {focusAreas.map((dimension, index) => (
                      <li key={dimension.id} className={styles.strengthItem}>
                        <div className={styles.itemTop}>
                          <span
                            className={styles.itemNumber}
                            aria-hidden="true"
                          >
                            {formatIndex(index)}
                          </span>
                          <span className={styles.dimensionPill}>
                            {dimension.score} / {SCORE_MAX} ·{' '}
                            {dimension.status}
                          </span>
                        </div>
                        <p className={styles.exampleLabel}>
                          Where to improve
                        </p>
                        <h3 className={styles.strengthTitle}>
                          {dimension.name}
                        </h3>
                        <p className={styles.strengthText}>
                          {dimension.explanation}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className={styles.panelFootnote}>
                    The AI model rated every dimension Strong. Re-run the
                    analysis after your next edit to confirm.
                  </p>
                )}
              </section>
            ) : null}

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
                  {isLive
                    ? 'Lines quoted from your draft, paired with a suggested revision.'
                    : 'Example sentences written for the fixture. They are not quotations from your draft.'}
                </p>
              </div>

              <ol className={styles.feedbackList}>
                {view.sentenceFeedback.map((item, index) => (
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
                          {getDimensionName(
                            view.dimensions,
                            item.dimensionId,
                          )}
                        </span>
                      </div>
                      <p className={styles.exampleLabel}>
                        {isLive ? 'Your sentence' : 'Example sentence'}
                      </p>
                      <p className={styles.feedbackSentence}>
                        {item.exampleSentence}
                      </p>
                    </div>

                    <div className={styles.feedbackDetail}>
                      <div>
                        <p className={styles.detailLabel}>
                          {isLive ? 'What stands out' : 'What to notice'}
                        </p>
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
                    {isLive
                      ? 'A few things to rehearse.'
                      : 'Three things to rehearse.'}
                  </h2>
                </div>
                <p className={styles.sectionLedger}>
                  {isLive
                    ? 'General delivery suggestions from the AI model. Nothing here comes from listening to you or measuring your voice, pace, tone, or body language.'
                    : 'Practical suggestions only. Nothing here comes from listening to you or measuring your voice, pace, tone, or body language.'}
                </p>
              </div>

              <ol className={styles.tipGrid}>
                {view.deliveryTips.map((tip, index) => (
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
                  {isLive
                    ? 'Your draft stays untouched in the workspace. Apply one suggestion from this review, then re-run the analysis to see what changes.'
                    : 'Your draft stays untouched in the workspace. The scores and notes on this page remain sample content; the revision step is where the next pass belongs.'}
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
        ) : null}
      </div>
    </section>
  );
}
