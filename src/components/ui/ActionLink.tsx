import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import styles from './ActionLink.module.css';

interface ActionLinkProps
  extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  to: string;
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'inverse';
  size?: 'md' | 'lg';
}

export function ActionLink({
  to,
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...anchorProps
}: ActionLinkProps) {
  const classes = [
    styles.action,
    styles[variant],
    styles[size],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <a href={to} className={classes} {...anchorProps}>
      <span>{children}</span>
      <ArrowRight
        className={styles.icon}
        size={size === 'lg' ? 18 : 16}
        aria-hidden="true"
      />
    </a>
  );
}
