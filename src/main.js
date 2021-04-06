const express = require('express');
const path = require('path');
const socketio = require('socket.io');
const { createServer } = require('http');

const Lobby = require('./lobby');

const app = express();
const server = createServer(app);
const io = socketio(server);
const lobby = new Lobby(io);

app.use('/', express.static(path.join(__dirname, '..', 'public')));

io.on('connection', socket => {
  console.log(`A new user (${socket.id}) has connected.`);

  socket.once('sign in', (username, callback) => {
    socket.username = username;
    callback({ name: username, id: socket.id, coins: 0 });
    lobby.admit(socket);
  });
});

server.listen(process.env.PORT || 3000);
