'use client';

import { useEffect } from 'react';
import { PushNotificationService } from '@/lib/push-notifications';

export function ServiceWorkerRegister() {
  useEffect(() => {
    // Register Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration);
          
          // Initialize push notifications
          PushNotificationService.registerServiceWorker();
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    }

    // Request notification permission
    PushNotificationService.requestPermission();
  }, []);

  return null;
}