import { io } from 'socket.io-client';

const SERVER_URL = 'http://localhost:5000'; // Update this to your backend URL in production

export const socket = io(SERVER_URL, {
  autoConnect: false, // Optional: connect manually
});
