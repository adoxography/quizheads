const fetch = require('node-fetch');
const path = require('path');
const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const { shuffle } = require('lodash');

let started = false;
let timeout = null;
let answer = 0;

const data = {
  currentPlayer: 0,
  players: [
    {
      score: 0,
      time: 60
    },
    {
      score: 0,
      time: 60
    }
  ],
  question: {
    text: '',
    options: []
  }
};

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

io.on('connection', socket => {
  console.log('a user connected');

  socket.on('start', async () => {
    started = true;
    for (let i = 0; i < data.players.length; i++) {
      data.players[i].time = 60;
    }

    await updateQuestion();

    timeout = setTimeout(function callback() {
      data.players[data.currentPlayer].time -= 1;
      io.emit('update', data);

      if (data.players[data.currentPlayer].time > 0) {
        timeout = setTimeout(callback, 1000);
      } else {
        started = false;
      }
    }, 1000);
  });

  socket.on('answer', async index => {
    if (index === answer) {
      data.players[data.currentPlayer].score++;
      data.currentPlayer = (data.currentPlayer + 1) % 2;
    }

    await updateQuestion();

    io.emit('update', data);
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

const updateQuestion = async () => {
  const response = await fetch('https://opentdb.com/api.php?amount=1&type=multiple');
  const { results } = await response.json();
  const result = results[0];
  const options = shuffle([result.correct_answer, ...result.incorrect_answers]);

  data.question = {
    text: result.question,
    options
  };
  answer = options.indexOf(result.correct_answer);
};

http.listen(3000, () => {
  console.log('Listening on 3000');
});
