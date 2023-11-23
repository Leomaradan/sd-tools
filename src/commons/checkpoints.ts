import { Checkpoints } from './types';

export const allCheckpoints = Object.values(Checkpoints).map((full) => {
  const filenameMatch = /\/([^/]+)\.(safetensors|ckpt)/i.exec(full);

  const hashMatch = /\[([a-z0-9]+)\]/i.exec(full) as RegExpExecArray;

  let filename;
  let hash;

  if (filenameMatch) {
    filename = filenameMatch[1];
  }

  if (hashMatch) {
    hash = hashMatch[1];
  }

  //const filename = (/\/([^/]+)\.(safetensors|ckpt)/i.exec(full) as RegExpExecArray)[1];
  //const hash = (/\[([a-z0-9]+)\]/i.exec(full) as RegExpExecArray)[1];

  return {
    filename,
    full,
    hash
  };
});
