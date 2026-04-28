import { getAuthHeaders } from './api';

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

export async function registerDeviceToken() {
  if (typeof window === 'undefined') return;
  if (!('Notification' in window)) return;
  if (!VAPID_KEY) {
    console.warn('NEXT_PUBLIC_FIREBASE_VAPID_KEY not set, skipping FCM registration');
    return;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;

    const { initializeApp } = await import('firebase/app');
    const { getMessaging, getToken } = await import('firebase/messaging');

    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };

    const app = initializeApp(firebaseConfig);
    const messaging = getMessaging(app);
    const token = await getToken(messaging, { vapidKey: VAPID_KEY });

    if (!token) return;

    const platform = /android/i.test(navigator.userAgent)
      ? 'android'
      : /iphone|ipad/i.test(navigator.userAgent)
      ? 'ios'
      : 'web';

    await fetch(`${API_URL}/api/devices/register/`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify({ token, platform }),
    });

    console.log('FCM token registered successfully');
  } catch (err) {
    console.error('FCM registration failed:', err);
  }
}