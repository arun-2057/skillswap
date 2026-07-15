import * as Sentry from '@sentry/nextjs';

export async function register() {
  await import('./src/utils/sentry-client');
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
