// Install event
self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  self.skipWaiting(); // Activate immediately
});

// Activate event
self.addEventListener('activate', event => {
  console.log('Service Worker activated');

  // Thank the user for enabling push notifications
  event.waitUntil(
    self.registration.showNotification('Thanks!', {
      body: 'Thanks for allowing push notifications!',
      icon: '/logo.png'
    })
  );

  // Claim clients immediately
  event.waitUntil(self.clients.claim());
});

// Push event
self.addEventListener('push', event => {
  let data = { title: '[No title, this is a error]', body: '[No body, this is a error, please email ellinet13@ellinet13.com]' };

  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (err) {
    console.error('Push event data parse error', err);
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/logo.png'
    })
  );
});
