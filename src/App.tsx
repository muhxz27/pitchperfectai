import { useLayoutEffect, useRef, useState } from 'react';
import { ScanSearch } from 'lucide-react';
import { AppShell } from './components/layout/AppShell';
import {
  ROUTE_TITLES,
  useHashRoute,
  type AppPath,
} from './lib/routing';
import {
  consumePendingSection,
  scrollToSection,
} from './lib/sectionNavigation';
import {
  createEmptyDraft,
  type SpeechDraft,
} from './lib/speechDraft';
import { AnalysisPage } from './pages/AnalysisPage';
import { LandingPage } from './pages/LandingPage';
import { PlaceholderPage } from './pages/PlaceholderPage';
import { RevisionPage } from './pages/RevisionPage';
import { WorkspacePage } from './pages/WorkspacePage';

const NOT_FOUND_TITLE = 'Page not found — PitchPerfect AI';

function getDocumentTitle(path: string) {
  return ROUTE_TITLES[path as AppPath] ?? NOT_FOUND_TITLE;
}

export default function App() {
  const path = useHashRoute();
  const [draft, setDraft] = useState<SpeechDraft>(createEmptyDraft);
  const isFirstRender = useRef(true);

  useLayoutEffect(() => {
    document.title = getDocumentTitle(path);

    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const pendingSection = consumePendingSection();

    document
      .getElementById('main-content')
      ?.focus({ preventScroll: true });

    if (!pendingSection) {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      const didScroll = scrollToSection(pendingSection, 'auto');

      if (!didScroll) {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [path]);

  function updateDraft(changes: Partial<SpeechDraft>) {
    setDraft((current) => ({ ...current, ...changes }));
  }

  function renderPage() {
    switch (path) {
      case '/':
        return <LandingPage />;

      case '/workspace':
        return (
          <WorkspacePage draft={draft} onDraftChange={updateDraft} />
        );

      case '/analysis':
        return <AnalysisPage draft={draft} />;

      case '/revision':
        return <RevisionPage draft={draft} />;

      default:
        return (
          <PlaceholderPage
            eyebrow="Page not found"
            tag="404"
            icon={<ScanSearch size={21} strokeWidth={1.8} />}
            title="This page missed its cue."
            description="The address may be out of date or mistyped. The landing page is still the best place to start."
            primaryAction={{
              label: 'Back to the landing page',
              to: '#/',
            }}
          />
        );
    }
  }

  return <AppShell>{renderPage()}</AppShell>;
}
