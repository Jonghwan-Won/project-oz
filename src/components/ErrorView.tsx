import { CommonButton, CommonButtonLink } from '@/components/ui/CommonButton';
import type { errorMessages } from '@/i18n/errors';
import s from './ErrorView.module.css';

export function ErrorView({
  labels,
  failure = false,
  onRetry,
}: {
  labels: (typeof errorMessages)['ko'];
  failure?: boolean;
  onRetry?: () => void;
}) {
  return (
    <section className={s.page} aria-labelledby="error-heading">
      <div className={s.art} aria-hidden="true">
        <span className={s.initial}>O</span>
        <span>ops!</span>
      </div>
      <p className={s.code}>
        {failure ? 'SOMETHING WENT WRONG' : '404 / PAGE NOT FOUND'}
      </p>
      <h1 id="error-heading">
        {failure ? labels.failureTitle : labels.notFoundTitle}
      </h1>
      <p className={s.description}>
        {failure ? labels.failureDescription : labels.notFoundDescription}
      </p>
      <div className={s.actions}>
        {onRetry && (
          <CommonButton variant="ghost" onClick={onRetry}>
            {labels.retry}
          </CommonButton>
        )}
        <CommonButtonLink href="/" variant="primary">
          {labels.home}
        </CommonButtonLink>
      </div>
    </section>
  );
}
