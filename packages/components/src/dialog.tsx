import { useEffect, type FormEventHandler, type MouseEvent, type ReactNode } from 'react';

import { joinClassNames } from './class-names';
import styles from './dialog.module.css';

type DialogTag = 'div' | 'form';

export interface DialogProps {
  children: ReactNode;
  onClose?: () => void;
  className?: string;
  backdropClassName?: string;
  role?: 'dialog' | 'alertdialog';
  ariaLabel?: string;
  ariaLabelledBy?: string;
  ariaDescribedBy?: string;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  as?: DialogTag;
  onSubmit?: FormEventHandler<HTMLFormElement>;
}

export function Dialog({
  children,
  onClose,
  className,
  backdropClassName,
  role = 'dialog',
  ariaLabel,
  ariaLabelledBy,
  ariaDescribedBy,
  closeOnBackdrop = true,
  closeOnEscape = false,
  as = 'div',
  onSubmit,
}: DialogProps) {
  useEffect(() => {
    if (!onClose || !closeOnEscape) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      onClose?.();
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [closeOnEscape, onClose]);

  const sharedProps = {
    className: joinClassNames(styles.dialog, 'modal', className),
    onClick: (event: MouseEvent<HTMLElement>) => event.stopPropagation(),
    role,
    'aria-modal': 'true' as const,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    'aria-describedby': ariaDescribedBy,
  };

  return (
    <div
      className={joinClassNames(styles.backdrop, 'modal-backdrop', backdropClassName)}
      onClick={closeOnBackdrop ? onClose : undefined}
      role="presentation"
    >
      {as === 'form' ? (
        <form {...sharedProps} onSubmit={onSubmit}>
          {children}
        </form>
      ) : (
        <div {...sharedProps}>{children}</div>
      )}
    </div>
  );
}
