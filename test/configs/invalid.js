/* eslint-disable */

const checkpoints = () => {
  return ['check1', 'check2'];
};

module.exports = {
  nothing: [
    {
      cfg: 7,
      checkpoints: checkpoints(),
      count: 4,
      height: 640,
      pattern: '[seed]-[datetime]',
      prompt: 'dynamic prompt',
      width: 1024
    }
  ]
};
