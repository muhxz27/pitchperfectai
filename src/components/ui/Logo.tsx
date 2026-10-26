import { AudioLines } from 'lucide-react';
import styles from './Logo.module.css';

interface LogoProps {
  className?: string;
}

export function Logo({ className = '' }: LogoProps) {
  return (
    <a
      className={`${styles.logo} ${className}`.trim()}
      href="#/"
      aria-label="PitchPerfect AI — home"
    >
      <span className={styles.mark} aria-hidden="true">
        <AudioLines size={18} strokeWidth={2} />
      </span>
      <span className={styles.wordmark} aria-hidden="true">
        PitchPerfect
        <span className={styles.suffix}>AI</span>
      </span>
    </a>
  );
}
