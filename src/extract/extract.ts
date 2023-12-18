import fs from 'fs';

import { getFiles } from '../commons/file';
import { logger } from '../commons/logger';
import { IAdetailerPrompt, IPromptSingle } from '../commons/queue';

export interface IExtractOptions {
  addBefore?: string;
  format: 'json' | 'textbox';
  output?: string;
  recursive?: boolean;
}

export interface IExtractOptionsFull extends Omit<IExtractOptions, 'format'> {
  format: string;
  source: string;
}

interface IFormatTextbox {
  cfg_scale?: number;
  height?: number;
  negative_prompt?: string;
  prompt?: string;
  sampler_name?: string;
  seed?: number;
  steps?: number;
  width?: number;
}

const getPromptTextBox = (options: {
  addBeforePrompt: string;
  basePrompt: string;
  cfg: number;
  negativePrompt: string;
  sampler: string;
  seed: number;
  sizes: { height: string; width: string } | null;
  steps: number;
}): string => {
  const { addBeforePrompt, basePrompt, cfg, negativePrompt, sampler, seed, sizes, steps } = options;

  const promptOptions: IFormatTextbox = {};

  promptOptions.prompt = addBeforePrompt !== '' ? `${addBeforePrompt}, ${basePrompt}` : basePrompt;

  if (negativePrompt !== '') {
    promptOptions.negative_prompt = negativePrompt;
  }

  if (!isNaN(steps)) {
    promptOptions.steps = Number(steps);
  }

  if (sampler !== '') {
    promptOptions.sampler_name = sampler;
  }

  if (!isNaN(cfg)) {
    promptOptions.cfg_scale = Number(cfg);
  }

  if (seed !== -1) {
    promptOptions.seed = Number(seed);
  }

  if (sizes) {
    Object.keys(sizes).forEach((key) => {
      promptOptions[key as keyof typeof sizes] = Number(sizes[key as keyof typeof sizes]);
    });
  }

  return Object.keys(promptOptions)
    .map((key) => {
      const value = promptOptions[key as keyof typeof promptOptions];

      if (typeof value === 'string') {
        return `--${key} "${value}"`;
      }

      return `--${key} ${value}`;
    })
    .join(' ');
};

const getPromptJSON = (options: {
  addBeforePrompt: string;
  adetailer: IAdetailerPrompt[];
  basePrompt: string;
  cfg: number;
  clip: number;
  denoise: number;
  hiresUpscalerName: string;
  model: string;
  negativePrompt: string;
  sampler: string;
  seed: number;
  sizes: { height: string; width: string } | null;
  steps: number;
  vae: string;
}): IPromptSingle => {
  const {
    addBeforePrompt,
    adetailer,
    basePrompt,
    cfg,
    clip,
    denoise,
    hiresUpscalerName,
    model,
    negativePrompt,
    sampler,
    seed,
    sizes,
    steps,
    vae
  } = options;

  const promptOptions: IPromptSingle = {
    autoCutOff: false,
    autoLCM: false,
    enableHighRes: false,
    prompt: addBeforePrompt !== '' ? `${addBeforePrompt}, ${basePrompt}` : basePrompt,
    restoreFaces: false
  };

  if (negativePrompt !== '') {
    promptOptions.negativePrompt = negativePrompt;
  }

  if (!isNaN(steps)) {
    promptOptions.steps = steps;
  }

  if (sampler !== '') {
    promptOptions.sampler = sampler;
  }

  if (!isNaN(cfg)) {
    promptOptions.cfg = cfg;
  }

  if (seed !== -1) {
    promptOptions.seed = seed;
  }

  if (sizes) {
    Object.keys(sizes).forEach((key) => {
      promptOptions[key as keyof typeof sizes] = Number(sizes[key as keyof typeof sizes]);
    });
  }

  if (model !== '') {
    promptOptions.checkpoints = model;
  }

  if (vae !== '') {
    promptOptions.vae = vae;
  }

  if (!isNaN(denoise)) {
    promptOptions.denoising = denoise;
  }

  if (!isNaN(clip)) {
    promptOptions.clipSkip = clip;
  }

  if (hiresUpscalerName !== '') {
    promptOptions.upscaler = hiresUpscalerName;
    promptOptions.enableHighRes = true;
  }

  if (adetailer.length > 0) {
    promptOptions.adetailer = adetailer;
  }

  return promptOptions;
};

const getAdetailerParamFromregex = (param: string, regex: RegExp) => {
  let match;
  const results: Record<string, string> = {};
  while ((match = regex.exec(param)) !== null) {
    // This is necessary to avoid infinite loops with zero-width matches
    if (match.index === regex.lastIndex) {
      regex.lastIndex++;
    }

    const index = match[2] ? Number(match[2]) : 1;

    results[String(index)] = match[3];
  }

  return results;
};

const getAdetailerParams = (otherParams: string): IAdetailerPrompt[] => {
  const adetailModelRegex = /ADetailer model( (\d+)nd)?: ([a-z0-9 +_.]+),/i;

  const adetailDenoisingRegex = /ADetailer denoising strength( (\d+)nd)?: ([a-z0-9 +_.]+),/i;
  const adetailPromptRegex = /ADetailer prompt( (\d+)nd)?: (".*"+|[a-z]+),/i;
  const adetailNegativePromptRegex = /ADetailer negative prompt( (\d+)nd)?: (".*"+|[a-z]+),/i;
  const adetailWidthRegex = /ADetailer inpaint width( (\d+)nd)?: (\d+),/i;
  const adetailHeightRegex = /ADetailer inpaint height( (\d+)nd)?: (\d+),/i;

  const models = getAdetailerParamFromregex(otherParams, adetailModelRegex);
  const denoise = getAdetailerParamFromregex(otherParams, adetailDenoisingRegex);
  const Prompt = getAdetailerParamFromregex(otherParams, adetailPromptRegex);
  const negativePrompt = getAdetailerParamFromregex(otherParams, adetailNegativePromptRegex);
  const width = getAdetailerParamFromregex(otherParams, adetailWidthRegex);
  const height = getAdetailerParamFromregex(otherParams, adetailHeightRegex);

  const results: Record<string, IAdetailerPrompt> = {};

  Object.entries(models).forEach(([index, model]) => {
    results[index] = {
      height: height[index] ? Number(height[index]) : undefined,
      model,
      negative: negativePrompt[index],
      prompt: Prompt[index],
      strength: denoise[index] ? Number(denoise[index]) : undefined,
      width: width[index] ? Number(width[index]) : undefined
    };
  });

  return Object.values(results);
};

const getPrompts = (data: string[], format: 'json' | 'textbox', addBeforePrompts: string[]) => {
  const hasNegative = data[data.length - 2].startsWith('Negative prompt: ');

  const otherParams = data[data.length - 1];
  const negativePromptRaw = hasNegative ? data[data.length - 2] : '';
  const basePrompt = hasNegative ? data.slice(0, data.length - 2).join(' ') : data.slice(0, data.length - 1).join(' ');

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
    if (format === 'json') {
      const modelTest = /Model: ([a-z0-9 +_.]+),/i.exec(otherParams);
      const vaeTest = /VAE: ([a-z0-9 +_.]+),/i.exec(otherParams);
      const denoising = /Denoising strength: ([0-9.]+),/i.exec(otherParams);
      const clipSkip = /Clip skip: (\d+),/i.exec(otherParams);
      const hiresUpscaler = /Hires upscaler: ([a-z0-9 +_.]+),/i.exec(otherParams);

      const model = modelTest ? modelTest[1] : '';
      const vae = vaeTest ? vaeTest[1] : '';
      const denoise = denoising ? Number(denoising[1]) : NaN;
      const clip = clipSkip ? Number(clipSkip[1]) : NaN;

      const hiresUpscalerName = hiresUpscaler ? hiresUpscaler[1] : '';

      return getPromptJSON({
        addBeforePrompt,
        adetailer: getAdetailerParams(otherParams),
        basePrompt,
        cfg,
        clip,
        denoise,
        hiresUpscalerName,
        model,
        negativePrompt,
        sampler,
        seed,
        sizes,
        steps,
        vae
      });
    }
    return getPromptTextBox({
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

export const extract = (source: string, { addBefore, format, output, recursive }: IExtractOptions) => {
  if (!fs.existsSync(source)) {
    logger(`Source directory ${source} does not exist`);
    process.exit(1);
  }

  const prompts: (IPromptSingle | string)[] = [];

  const filesList = getFiles(source, recursive);

  filesList.forEach((file) => {
    const addBeforePrompts = addBefore ? addBefore.split('|') : [''];

    if (file.data) {
      const prompt = getPrompts(file.data, format, addBeforePrompts);
      if (prompt) {
        prompts.push(...prompt);
      }
    }
  });

  const result = format === 'json' ? JSON.stringify({ prompts }) : prompts.join('\n');

  if (output) {
    fs.writeFileSync(output, result);
  } else {
    logger(result);
  }
};
