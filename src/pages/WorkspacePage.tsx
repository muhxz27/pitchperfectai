import {
  useId,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type MouseEvent,
} from 'react';
import {
  AlertCircle,
  ArrowRight,
  Check,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { WorkflowIntro } from '../components/workspace/WorkflowIntro';
import {
  AUDIENCE_OPTIONS,
  countWords,
  GOAL_OPTIONS,
  MAX_SPEECH_CHARS,
  MAX_SPEECH_WORDS,
  MAX_TITLE_CHARS,
  MIN_SPEECH_WORDS,
  SAMPLE_DRAFT,
  type SpeechDraft,
} from '../lib/speechDraft';
import styles from './WorkspacePage.module.css';

interface WorkspacePageProps {
  draft: SpeechDraft;
  onDraftChange: (changes: Partial<SpeechDraft>) => void;
}

export function WorkspacePage({
  draft,
  onDraftChange,
}: WorkspacePageProps) {
  const id = useId();
  const pageTitleId = `${id}-page-title`;
  const titleInputId = `${id}-title`;
  const speechInputId = `${id}-speech`;
  const wordCountId = `${id}-word-count`;
  const minimumId = `${id}-minimum`;
  const errorId = `${id}-error`;
  const editorHeadingId = `${id}-editor-heading`;
  const settingsHeadingId = `${id}-settings-heading`;
  const clearTitleId = `${id}-clear-title`;
  const clearDescriptionId = `${id}-clear-description`;

  const speechRef = useRef<HTMLTextAreaElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [submitted, setSubmitted] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  const wordCount = countWords(draft.speech);
  const hasSpeech = draft.speech.trim().length > 0;
  const meetsMinimum = wordCount >= MIN_SPEECH_WORDS;
  const exceedsMaximum =
    wordCount > MAX_SPEECH_WORDS || draft.speech.length > MAX_SPEECH_CHARS;
  const hasDraftText =
    draft.title.trim().length > 0 || draft.speech.trim().length > 0;

  const errorMessage =
    submitted && exceedsMaximum
      ? draft.speech.length > MAX_SPEECH_CHARS
        ? `Your speech is over ${MAX_SPEECH_CHARS.toLocaleString(
            'en-US',
          )} characters. Shorten it before you analyse.`
        : `Your speech is over ${MAX_SPEECH_WORDS.toLocaleString(
            'en-US',
          )} words. Shorten it before you analyse.`
      : submitted && !meetsMinimum
        ? hasSpeech
          ? 'Your speech is under 50 words. Add a little more before you analyse.'
          : 'Your speech is empty. Add a draft or try the sample speech.'
        : null;

  const describedBy = `${wordCountId} ${minimumId}${
    errorMessage ? ` ${errorId}` : ''
  }`;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!meetsMinimum || exceedsMaximum) {
      setSubmitted(true);
      window.requestAnimationFrame(() => {
        speechRef.current?.focus();
      });
      return;
    }

    window.location.hash = '#/analysis';
  }

  function handleUseSample() {
    onDraftChange({
      title: draft.title.trim() ? draft.title : SAMPLE_DRAFT.title,
      speech: SAMPLE_DRAFT.speech,
    });
    setSubmitted(false);
    setAnnouncement(
      `Sample speech loaded. ${countWords(SAMPLE_DRAFT.speech)} words.`,
    );
  }

  function openClearDialog() {
    if (!hasDraftText || !dialogRef.current) return;
    dialogRef.current.showModal();
  }

  function closeClearDialog() {
    dialogRef.current?.close();
  }

  function confirmClear() {
    dialogRef.current?.close();
    onDraftChange({ title: '', speech: '' });
    setSubmitted(false);
    setAnnouncement('Draft cleared.');
    window.requestAnimationFrame(() => {
      speechRef.current?.focus();
    });
  }

  function handleDialogClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) {
      closeClearDialog();
    }
  }

  function handleDialogKeyDown(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== 'Tab') {
      return;
    }

    const buttons =
      dialogRef.current?.querySelectorAll<HTMLButtonElement>(
        'button:not(:disabled)',
      );

    if (!buttons?.length) {
      return;
    }

    const first = buttons[0];
    const last = buttons[buttons.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <section className={styles.page} aria-labelledby={pageTitleId}>
      <div className="container">
        <WorkflowIntro
          backHref="#/"
          backLabel="Back to overview"
          eyebrow="Workspace · Step 1 of 3"
          title={
            <>
              Let’s <em>work</em> on your speech.
            </>
          }
          titleId={pageTitleId}
          description="Bring the draft you have, choose who you’re speaking to and what it should do. The first pass doesn’t need to be polished."
          currentStep="write"
        />

        <form className={styles.layout} onSubmit={handleSubmit} noValidate>
          <section
            className={styles.editorPanel}
            aria-labelledby={editorHeadingId}
          >
            <div className={styles.panelHeader}>
              <h2 id={editorHeadingId} className={styles.panelTitle}>
                Your draft
              </h2>

              <div className={styles.draftActions}>
                <button
                  type="button"
                  className={styles.sampleButton}
                  onClick={handleUseSample}
                >
                  <Sparkles size={15} strokeWidth={1.9} aria-hidden="true" />
                  Use sample speech
                </button>
                <button
                  type="button"
                  className={styles.clearButton}
                  onClick={openClearDialog}
                  disabled={!hasDraftText}
                >
                  <Trash2 size={15} strokeWidth={1.9} aria-hidden="true" />
                  Clear draft
                </button>
              </div>
            </div>

            <div className={styles.field}>
              <label htmlFor={titleInputId} className={styles.label}>
                Speech title
                <span className={styles.optional}>Optional</span>
              </label>
              <input
                id={titleInputId}
                className={styles.titleInput}
                type="text"
                maxLength={MAX_TITLE_CHARS}
                value={draft.title}
                onChange={(event) =>
                  onDraftChange({ title: event.target.value })
                }
                placeholder="e.g. My speech for the final round"
              />
            </div>

            <div className={styles.field}>
              <label htmlFor={speechInputId} className={styles.label}>
                Speech draft
              </label>

              {errorMessage ? (
                <p id={errorId} className={styles.error} role="alert">
                  <AlertCircle
                    size={16}
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                  <span>{errorMessage}</span>
                </p>
              ) : null}

              <textarea
                ref={speechRef}
                id={speechInputId}
                className={styles.speechInput}
                value={draft.speech}
                onChange={(event) =>
                  onDraftChange({ speech: event.target.value })
                }
                placeholder="Paste or write your speech here. A rough draft is fine — we’ll help with the shape."
                rows={12}
                aria-required="true"
                aria-invalid={errorMessage ? true : undefined}
                aria-describedby={describedBy}
              />

              <div className={styles.counterRow}>
                <p id={wordCountId} className={styles.wordCount}>
                  <span className={styles.wordCountValue}>{wordCount}</span>{' '}
                  {wordCount === 1 ? 'word' : 'words'}
                </p>
                <p
                  id={minimumId}
                  className={styles.minimum}
                  data-met={meetsMinimum ? 'true' : 'false'}
                >
                  {meetsMinimum ? (
                    <Check
                      size={13}
                      strokeWidth={2.4}
                      aria-hidden="true"
                    />
                  ) : null}
                  {meetsMinimum
                    ? '50-word minimum met'
                    : 'Minimum 50 words'}
                </p>
              </div>
            </div>
          </section>

          <section
            className={styles.settingsPanel}
            aria-labelledby={settingsHeadingId}
          >
            <div className={styles.panelHeader}>
              <div>
                <h2 id={settingsHeadingId} className={styles.panelTitle}>
                  Audience &amp; goal
                </h2>
                <p className={styles.panelHint}>
                  These choices shape the feedback.
                </p>
              </div>
            </div>

            <fieldset className={styles.fieldset}>
              <legend className={styles.legend}>Who’s listening?</legend>
              <div
                className={`${styles.optionGrid} ${styles.audienceOptions}`}
              >
                {AUDIENCE_OPTIONS.map((option) => {
                  const isSelected = draft.audience === option.value;

                  return (
                    <label
                      key={option.value}
                      className={styles.option}
                      data-selected={isSelected ? 'true' : 'false'}
                    >
                      <input
                        className={styles.radio}
                        type="radio"
                        name="audience"
                        value={option.value}
                        checked={isSelected}
                        onChange={() =>
                          onDraftChange({ audience: option.value })
                        }
                      />
                      <span className={styles.radioMark} aria-hidden="true" />
                      <span>{option.label}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <fieldset className={styles.fieldset}>
              <legend className={styles.legend}>
                What should the speech do?
              </legend>
              <div className={styles.optionGrid}>
                {GOAL_OPTIONS.map((option) => {
                  const isSelected = draft.goal === option.value;

                  return (
                    <label
                      key={option.value}
                      className={styles.option}
                      data-selected={isSelected ? 'true' : 'false'}
                    >
                      <input
                        className={styles.radio}
                        type="radio"
                        name="goal"
                        value={option.value}
                        checked={isSelected}
                        onChange={() =>
                          onDraftChange({ goal: option.value })
                        }
                      />
                      <span className={styles.radioMark} aria-hidden="true" />
                      <span>{option.label}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <div className={styles.submitArea}>
              <button type="submit" className={styles.analyseButton}>
                <span>Analyse my speech</span>
                <ArrowRight
                  className={styles.submitIcon}
                  size={18}
                  strokeWidth={2}
                  aria-hidden="true"
                />
              </button>
              <p className={styles.submitNote}>
                Your draft stays here if you come back.
              </p>
            </div>
          </section>
        </form>

        <dialog
          ref={dialogRef}
          className={styles.dialog}
          aria-labelledby={clearTitleId}
          aria-describedby={clearDescriptionId}
          onClick={handleDialogClick}
          onKeyDown={handleDialogKeyDown}
        >
          <div className={styles.dialogBody}>
            <p className={styles.dialogEyebrow}>Clear draft</p>
            <h2 id={clearTitleId} className={styles.dialogTitle}>
              Start over with an empty page?
            </h2>
            <p id={clearDescriptionId} className={styles.dialogText}>
              This removes your speech title and text. Your audience and
              goal choices will stay as they are.
            </p>
            <div className={styles.dialogActions}>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={closeClearDialog}
              >
                Keep draft
              </button>
              <button
                type="button"
                className={styles.confirmButton}
                onClick={confirmClear}
              >
                Clear draft
              </button>
            </div>
          </div>
        </dialog>

        <p className="visually-hidden" role="status" aria-atomic="true">
          {announcement}
        </p>
      </div>
    </section>
  );
}
