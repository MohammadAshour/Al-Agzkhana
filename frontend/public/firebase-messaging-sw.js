importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyAeJhE5OmSfTgijb2qhYcl_WW-ss_9fQKg",
  authDomain: "al-agzkhana.firebaseapp.com",
  projectId: "al-agzkhana",
  storageBucket: "al-agzkhana.firebasestorage.app",
  messagingSenderId: "1087491145137",
  appId: "1:1087491145137:web:76539ee7c65b7c505f9190"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  const { title, body } = payload.notification;
  self.registration.showNotification(title, {
    body,
    icon: '/icon-192.png',
  });
});