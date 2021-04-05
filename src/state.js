const QuestionBank = require('./question_bank');
const Player = require('./player');

class GameState {
  constructor(room, sockets) {
    this.room = room;
    this.players = sockets.map(socket => new Player(socket));
    this.turn = 0;
    this.reviewUntil = -1;
    this.lastGuess = null;
    this.questionBank = new QuestionBank();
  }

  tick(time) {
    this.currentPlayer.time -= time;

    if (this.reviewUntil > 0 && this.status === 'play') {
      const lastQuestion = this.questionBank.pop();
      this.reviewUntil = -1;

      if (this.lastGuess === lastQuestion.answer) {
        this.nextTurn();
      }
    }
  }

  nextTurn() {
    do {
      this.turn = (this.turn + 1) % this.players.length;
    } while (!this.players[this.turn].active);
  }

  isGameOver() {
    const activePlayers = this.players.filter(player => player.active);
    const playersWithTimeLeft = activePlayers.filter(player => player.time > 0);

    if (this.players.length === 1) {
      if (playersWithTimeLeft.length === 0) {
        return true;
      }
    } else if (playersWithTimeLeft.length <= 1) {
      return true;
    }

    return false;
  }

  removePlayer(id) {
    const player = this.players.find(player => player.id === id);
    
    if (player) {
      player.active = false;
    }
  }

  guess(guess) {
    if (guess === this.question.answer) {
      this.currentPlayer.score++;
    }

    this.lastGuess = guess;
    this.reviewUntil = Date.now() + 500;
  }

  async connect() {
    await this.questionBank.populate();
  }

  get question() {
    return this.questionBank.first();
  }

  get currentPlayer() {
    return this.players[this.turn % 2];
  }

  get status() {
    if (this.isGameOver()) {
      return 'results';
    }

    if (Date.now() < this.reviewUntil) {
      return 'review';
    }

    return 'play';
  }

  withoutSecrets() {
    return {
      status: this.status,
      turn: this.turn,
      room: {
        name: this.room.id
      },
      players: this.players.map(player => player.withoutSecrets()),
      lastGuess: this.lastGuess,
      question: this.status === 'play'
        ? this.question.withoutSecrets()
        : this.question.serialize(),
    };
  }
}

module.exports = GameState;
