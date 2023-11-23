import fs from 'fs';

import { readFiles } from '../commons/file';

export const extract = (source: string, addBefore: string | undefined, output: string | undefined) => {
  if (!fs.existsSync(source)) {
    console.log(`Source directory ${source} does not exist`);
    process.exit(1);
  }

  const prompts: string[] = [];

  readFiles(source).forEach((file) => {
    console.log(file.filename);

    const addBeforePrompts = addBefore ? addBefore.split('|') : [''];

    if (file.data) {
      const [basePrompt, negativePromptRaw, otherParams] = file.data;

      const negativePrompt = negativePromptRaw.replace('Negative prompt: ', '');

      const stepsTest = /Steps: ([0-9]+),/.exec(otherParams);
      const samplerTest = /Sampler: ([a-z0-9 +]+), /i.exec(otherParams);
      const cfgTest = /CFG scale: ([0-9.]+), /i.exec(otherParams);
      const seedTest = /Seed: ([0-9]+),/i.exec(otherParams);
      const sizesTest = /Size: ([0-9]+)x([0-9]+),/i.exec(otherParams);

      const steps = stepsTest ? Number(stepsTest[1]) : NaN;
      const sampler = samplerTest ? samplerTest[1] : '';
      const cfg = cfgTest ? Number(cfgTest[1]) : NaN;
      const seed = seedTest ? Number(seedTest[1]) : -1;
      const sizes = sizesTest ? { height: sizesTest[2], width: sizesTest[1] } : null;

      addBeforePrompts.forEach((addBeforePrompt) => {
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

        prompts.push(prompt);
      });
    }
  });

  if (output) {
    fs.writeFileSync(output, prompts.join('\n'));
  } else {
    console.log(prompts.join('\n'));
  }
};
