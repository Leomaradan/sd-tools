const checkpoints = () => {
  return ["check1", "check2"]
}

module.exports = {
  prompts: [
    {
      cfg: 7,
      checkpoints: checkpoints(),
      count: 4,
      height: 640,
      pattern: '[seed]-[datetime]',
      prompt: 'dynamic prompt CJS',
      width: 1024
    }
  ]
};
