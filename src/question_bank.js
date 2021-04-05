const fetch = require('node-fetch');
const { shuffle } = require('lodash');

const Question = require('./question');

class QuestionBank {
  constructor(minSize = 10) {
    this.minSize = minSize;
    this.questions = [];
    this.token = null;
  }

  first() {
    if (this.questions.length === 0) {
      throw new Error('There are no questions');
    }

    return this.questions[0];
  }

  pop() {
    const first = this.questions.shift();

    if (this.questions.length < this.minSize) {
      this.populate();
    }

    return first;
  }

  async populate() {
    if (!this.token) {
      await this.getToken();
    }

    const response = await fetch(`https://opentdb.com/api.php?amount=${this.minSize*2}&type=multiple&token=${this.token}`);
    const json = await response.json();
    const { results } = json;

    this.questions = [
      ...this.questions,
      ...results.map(result => {
        const options = shuffle([
          result.correct_answer,
          ...result.incorrect_answers
        ]);
        return new Question(result.question, options, result.correct_answer);
      })
    ];
  }

  async getToken() {
    const response = await fetch('https://opentdb.com/api_token.php?command=request');
    const json = await response.json();
    const { token } = json;

    this.token = token;
  }
}

module.exports = QuestionBank;
