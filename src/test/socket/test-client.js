const io = require('socket.io-client');

const userId = '6833f0c726a34c61f943d359';

// const socket = io('http://localhost:3000', {
//   reconnection: true,
//   reconnectionDelay: 1000,
//   reconnectionDelayMax: 5000,
//   reconnectionAttempts: 3,
//   transports: ['websocket']
// });

const socket = io('http://127.0.0.1:3000', { transports: ['websocket'] });
// const socket = io('https://rendezvous.techwiz.tech', { transports: ['websocket'] });
socket.on('connect', () => {
  console.log('[TestClient] Connected as socket:', socket.id);
  socket.emit('register', userId);
});

socket.on('connect_error', (err) => {
  console.error('[TestClient] ❌ Connection error:', err.message);
});

socket.on('new_notification', (data) => {
  console.log('[TestClient] 🔔 Received notification:', data);
});

socket.on('disconnect', () => {
  console.log('[TestClient] Disconnected');
});