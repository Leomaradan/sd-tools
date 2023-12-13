import fs from 'fs';

import { getFiles } from '../commons/file';
import { logger } from '../commons/logger';

export interface IExtractOptions {
  addBefore?: string;
  output?: string;
  recursive?: boolean;
}

export interface IExtractOptionsFull extends IExtractOptions {
  source: string;
}

const getPrompt = (options: {
  addBeforePrompt: string;
  basePrompt: string;
  cfg: number;
  negativePrompt: string;
  sampler: string;
  seed: number;
  sizes: { height: string; width: string } | null;
  steps: number;
}) => {
  const { addBeforePrompt, basePrompt, cfg, negativePrompt, sampler, seed, sizes, steps } = options;

  let prompt = addBeforePrompt !== '' ? `--prompt "${addBeforePrompt}, ${basePrompt}" ` : `--prompt "${basePrompt}" `;

  if (negativePrompt !== '') {
    prompt += `--negative_prompt "${negativePrompt}" `;
  }

  if (!isNaN(steps)) {
    prompt += `--steps ${steps} `;
  }

  if (sampler !== '') {
    prompt += `--sampler_name "${sampler}" `;
  }

  if (!isNaN(cfg)) {
    prompt += `--cfg_scale ${cfg} `;
  }

  if (seed !== -1) {
    prompt += `--seed ${seed} `;
  }

  if (sizes) {
    Object.keys(sizes).forEach((key) => {
      prompt += `--${key} ${sizes[key as keyof typeof sizes]} `;
    });
  }

  return prompt;
};

const getPrompts = (data: string[], addBeforePrompts: string[]) => {
  const [basePrompt, negativePromptRaw, otherParams] = data;

  const negativePrompt = negativePromptRaw.replace('Negative prompt: ', '');

  const stepsTest = /Steps: (\d+),/.exec(otherParams);
  const samplerTest = /Sampler: ([a-z0-9 +]+), /i.exec(otherParams);
  const cfgTest = /CFG scale: ([0-9.]+), /i.exec(otherParams);
  const seedTest = /Seed: (\d+),/i.exec(otherParams);
  const sizesTest = /Size: (\d+)x(\d+),/i.exec(otherParams);

  const steps = stepsTest ? Number(stepsTest[1]) : NaN;
  const sampler = samplerTest ? samplerTest[1] : '';
  const cfg = cfgTest ? Number(cfgTest[1]) : NaN;
  const seed = seedTest ? Number(seedTest[1]) : -1;
  const sizes = sizesTest ? { height: sizesTest[2], width: sizesTest[1] } : null;

  return addBeforePrompts.map((addBeforePrompt) => {
    return getPrompt({
      addBeforePrompt,
      basePrompt,
      cfg,
      negativePrompt,
      sampler,
      seed,
      sizes,
      steps
    });
  });
};

export const extract = (source: string, { addBefore, output, recursive }: IExtractOptions) => {
  if (!fs.existsSync(source)) {
    logger(`Source directory ${source} does not exist`);
    process.exit(1);
  }

  const prompts: string[] = [];

  const filesList = getFiles(source, recursive);

  filesList.forEach((file) => {
    const addBeforePrompts = addBefore ? addBefore.split('|') : [''];

    if (file.data) {
      const prompt = getPrompts(file.data, addBeforePrompts);
      if (prompt) {
        prompts.push(...prompt);
      }
    }
  });

  if (output) {
    fs.writeFileSync(output, prompts.join('\n'));
  } else {
    logger(prompts.join('\n'));
  }
};
