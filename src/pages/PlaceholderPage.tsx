import { useId } from 'react';
import type { ReactNode } from 'react';
import { ActionLink } from '../components/ui/ActionLink';
import styles from './PlaceholderPage.module.css';

interface PlaceholderAction {
  label: string;
  to: string;
}

interface PlaceholderPageProps {
  eyebrow: string;
  title: string;
  description: string;
  icon: ReactNode;
  items?: string[];
  listTitle?: string;
  primaryAction: PlaceholderAction;
  secondaryAction?: PlaceholderAction;
  tag?: string;
  note?: string;
}

export function PlaceholderPage({
  eyebrow,
  title,
  description,
  icon,
  items,
  listTitle = 'What will live here',
  primaryAction,
  secondaryAction,
  tag,
  note,
}: PlaceholderPageProps) {
  const titleId = useId();

  return (
    <section className={styles.page} aria-labelledby={titleId}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.card}>
          <div className={styles.topline}>
            <span className={styles.iconWrap} aria-hidden="true">
              {icon}
            </span>
            <p className={styles.eyebrow}>{eyebrow}</p>
            {tag ? <span className={styles.tag}>{tag}</span> : null}
          </div>

          <h1 id={titleId} className={styles.title}>
            {title}
          </h1>
          <p className={styles.description}>{description}</p>

          {items?.length ? (
            <div className={styles.listBlock}>
              <h2 className={styles.listTitle}>{listTitle}</h2>
              <ul className={styles.list}>
                {items.map((item) => (
                  <li key={item} className={styles.listItem}>
                    <span className={styles.marker} aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className={styles.actions}>
            <ActionLink to={primaryAction.to} size="lg">
              {primaryAction.label}
            </ActionLink>
            {secondaryAction ? (
              <ActionLink
                to={secondaryAction.to}
                variant="secondary"
                size="lg"
              >
                {secondaryAction.label}
              </ActionLink>
            ) : null}
          </div>

          {note ? <p className={styles.note}>{note}</p> : null}
        </div>
      </div>
    </section>
  );
}
