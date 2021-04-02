const socket = io();

const question = document.querySelector('#question');
const options = document.querySelectorAll('#options button');
const timers = document.querySelectorAll('#timers time');
const startEl = document.querySelector('#start');

for (let i = 0; i < options.length; i++) {
  const option = options[i];
  option.addEventListener('click', e => {
    e.preventDefault();
    socket.emit('answer', i);
  });
}

startEl.addEventListener('click', () => {
  socket.emit('start');
});

socket.on('update', data => {
  data.players.forEach((player, i) => {
    timers[i].textContent = new Date(player.time * 1000).toISOString().substr(14, 5);
  });

  question.innerHTML = data.question.text;
  data.question.options.forEach((option, i) => {
    options[i].innerHTML = option;
  });
});
