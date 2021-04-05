class Question {
  constructor(text, options, answer) {
    this.text = text;
    this.options = options;
    this.answer = answer;
  }

  serialize() {
    return {
      text: this.text,
      options: this.options,
      answer: this.answer
    };
  }

  withoutSecrets() {
    return {
      text: this.text,
      options: this.options
    };
  }
}

module.exports = Question;
