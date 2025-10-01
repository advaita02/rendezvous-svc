const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:3000/socket.io/?EIO=4&transport=websocket');

ws.on('open', function open() {
  console.log('✅ WebSocket connected!');
});

ws.on('error', function error(err) {
  console.error('❌ WebSocket error:', err.message);
});
