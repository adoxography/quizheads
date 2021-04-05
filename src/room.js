const crypto = require('crypto');
const GameState = require('./state');

class Room {
  constructor(io, lobby) {
    this.io = io;
    this.lobby = lobby;

    this.id = crypto.randomBytes(10).toString('hex');
    this.players = [];
    this.state = null;

    console.log(`Room '${this.id}' has been created.`);
  }

  admit(socket) {
    console.log(`${socket.username} has joined room '${this.id}'`);

    this.players.push(socket);
    socket.join(this.id);
    this.broadcastState();

    socket.on('start', () => this.start());
    socket.on('answer', guess => this.handleGuess(guess));
    socket.once('leave', () => {
      this.removePlayer(socket.id)
      this.lobby.admit(socket);
    });
    socket.on('disconnecting', () => this.removePlayer(socket.id));
  }

  async start() {
    this.state = new GameState(this, this.players);
    await this.state.connect();

    console.log(`A game in room '${this.id}' has started.`);

    this.broadcastState();
    setTimeout(() => this.tick(), 100);
  }

  removePlayer(playerID) {
    if (this.state) {
      this.state.removePlayer(playerID);
    }

    const player = this.players.find(player => player.id === playerID);
    this.players = this.players.filter(player => player.id !== playerID);
    if (player) {
      player.leave(this.id);
      player.removeAllListeners('start');
      player.removeAllListeners('enter');
    }

    if (this.players.length === 0) {
      this.lobby.close(this.id);
    }
  }

  isJoinable() {
    return this.state === null;
  }

  handleGuess(guess) {
    this.state.guess(guess);
    this.broadcastState();
  }

  broadcastState() {
    const state = this.state
      ? this.state.withoutSecrets()
      : {
          status: 'wait',
          room: { name: this.id },
          players: this.players.map(player => ({
            id: player.id,
            name: player.username
          }))
        };

    this.io.to(this.id).emit('update', state);
  }

  tick() {
    this.state.tick(100);

    if (!this.state.isGameOver()) {
      setTimeout(() => this.tick(), 100);
    }

    this.broadcastState();
  }
}

module.exports = Room;
