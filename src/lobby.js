const Room = require('./room');

class Lobby {
  constructor(io) {
    this.io = io;
    this.rooms = [];
    this.players = [];

    this.io.on('close room', id => {
      console.log(`Closing room '${id}'`);
    });
  }

  admit(socket) {
    console.log(`${socket.username} has joined the lobby.`);

    socket.join('lobby');
    this.players.push(socket);
    this.broadcastState();

    socket.on('create', callback => {
      const room = new Room(this.io, this);
      this.rooms.push(room);

      room.admit(socket);
      this.expel(socket);

      callback({ id: room.id });
    });

    socket.on('join', roomID => {
      const room = this.rooms.find(room => room.id === roomID);

      room.admit(socket);
      this.expel(socket);
    });
  }

  expel(socket) {
    this.players = this.players.filter(player => player.id !== socket.id);
    socket.leave('lobby');
    socket.removeAllListeners('create');
    socket.removeAllListeners('join');

    this.broadcastState();
  }

  close(roomID) {
    console.log(`Closing room '${roomID}'`);
    this.rooms = this.rooms.filter(room => room.id !== roomID);
  }

  broadcastState() {
    this.io.to('lobby').emit('update', {
      status: 'lobby',
      rooms: this.rooms.filter(room => room.isJoinable())
        .map(room => ({
          id: room.id,
          size: room.players.length
        }))
    });
  }
}

module.exports = Lobby;
