class Player {
  constructor(socket) {
    this.name = socket.username;
    this.socket = socket;
    this.score = 0;
    this.time = 60000;
    this.active = true;
  }

  get id() {
    return this.socket.id;
  }

  withoutSecrets() {
    return {
      id: this.id,
      name: this.name,
      score: this.score,
      time: this.time,
      active: this.active
    };
  }
}

module.exports = Player;
