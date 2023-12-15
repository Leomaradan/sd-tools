import fs from 'fs';
import { basename } from 'path';

import { Config } from '../commons/config';
import { IFile, getBase64Image, getFiles } from '../commons/file';
import { logger } from '../commons/logger';
import { findControlnetModel, findSampler } from '../commons/models';
import { interrogateQuery, renderQuery } from '../commons/query';
import { ControlNetMode, ControlNetModules, ControlNetResizes, IImg2ImgQuery, IUltimateSDUpscale } from '../commons/types';

export interface IUpscaleOptions {
  checkpoint?: string;
  denoising?: number[];
  recursive?: boolean;
  upscaling?: number[];
}

export interface IUpscaleOptionsFull extends IUpscaleOptions {
  source: string;
}

const prepareQueryData = (baseParamsProps: IImg2ImgQuery, file: IFile) => {
  const baseParams = { ...baseParamsProps };
  const [basePromptFull, negativePromptRaw, otherParams] = file.data as string[];

  const negativePrompt = negativePromptRaw.replace('Negative prompt: ', '');

  const stepsTest = /Steps: (\d+),/.exec(otherParams);
  const samplerTest = /Sampler: ([a-z0-9 +]+), /i.exec(otherParams);
  const cfgTest = /CFG scale: ([0-9.]+), /i.exec(otherParams);
  const seedTest = /Seed: (\d+),/i.exec(otherParams);
  const sizesTest = /Size: (\d+)x(\d+),/i.exec(otherParams);

  const steps = stepsTest ? Number(stepsTest[1]) : undefined;
  const sampler = samplerTest ? samplerTest[1] : undefined;
  const cfg = cfgTest ? Number(cfgTest[1]) : undefined;
  const seed = seedTest ? Number(seedTest[1]) : undefined;

  const promptWidth = sizesTest ? Number(sizesTest[1]) : undefined;
  const promptHeight = sizesTest ? Number(sizesTest[2]) : undefined;

  const basePrompt = basePromptFull.replace(/<lora:[a-z0-9- _]+:[0-9.]+>/gi, '');

  baseParams.prompt = basePrompt;
  baseParams.init_images = [getBase64Image(file.filename)];

  if (negativePrompt !== undefined && negativePrompt !== '') {
    baseParams.negative_prompt += negativePrompt;
  }

  if (steps !== undefined) {
    baseParams.steps = steps;
  }

  if (sampler !== undefined) {
    const foundSampler = findSampler(sampler);
    if (foundSampler) {
      baseParams.sampler_name = foundSampler.name;
    }
  }

  if (cfg !== undefined) {
    baseParams.cfg_scale = cfg;
  }

  if (seed !== undefined) {
    baseParams.seed = seed;
  }

  if (promptWidth !== undefined) {
    baseParams.width = promptWidth;
    (baseParams.ultimateSdUpscale as IUltimateSDUpscale).width = promptWidth * (baseParams.ultimateSdUpscale as IUltimateSDUpscale).scale;
  }

  if (promptHeight !== undefined) {
    baseParams.height = promptHeight;
    (baseParams.ultimateSdUpscale as IUltimateSDUpscale).height = promptHeight * (baseParams.ultimateSdUpscale as IUltimateSDUpscale).scale;
  }

  return baseParams;
};

const prepareQuery = async (file: IFile, scaleFactor: number, denoising_strength: number) => {
  let { height, width } = file;

  if (width === -1 || height === -1) {
    width = 512;
    height = 512;
  }

  let baseParams: IImg2ImgQuery = {
    controlNet: {
      control_mode: ControlNetMode.ControleNetImportant,
      controlnet_model: findControlnetModel('tile')?.name as string,
      controlnet_module: ControlNetModules.TileResample,
      resize_mode: ControlNetResizes.Resize
    },
    denoising_strength,
    init_images: [getBase64Image(file.filename)],
    negative_prompt: Config.get('commonNegative'),

    override_settings: {
      samples_filename_pattern: `[datetime]-x${scaleFactor}-${basename(file.file)
        .replace('.png', '')
        .replace('.jpg', '')
        .replace('.jpeg', '')}`
    },
    prompt: '',
    sdxl: false,
    ultimateSdUpscale: {
      height: height * scaleFactor,
      scale: scaleFactor,
      width: width * scaleFactor
    }
  };

  let ready = false;
  if (file.data) {
    baseParams = prepareQueryData(baseParams, file);
    width = baseParams.width ?? width;
    height = baseParams.height ?? height;

    ready = true;
  } else {
    const prompt = await interrogateQuery(file.filename);

    if (prompt) {
      baseParams.prompt = prompt.prompt;
      ready = true;
    }
  }

  if (ready) {
    return { baseParams, height, width };
  }
};

const getCombination = (filesList: IFile[], denoising: number[], scaleFactors: number[]) => {
  const combinations: Array<{ denoising_strength: number; file: IFile; scaleFactor: number }> = [];
  for (const file of filesList) {
    for (const denoising_strength of denoising) {
      for (const scaleFactor of scaleFactors) {
        combinations.push({ denoising_strength, file, scaleFactor });
      }
    }
  }

  return combinations;
};

export const upscaleTiles = async (
  source: string,
  { checkpoint, denoising: denoisingArray, recursive, upscaling: upscalingArray }: IUpscaleOptions
) => {
  if (!fs.existsSync(source)) {
    logger(`Source directory ${source} does not exist`);
    process.exit(1);
  }

  const queries: IImg2ImgQuery[] = [];

  const filesList = getFiles(source, recursive);

  const denoising = denoisingArray ?? [0.3];
  const upscaling = upscalingArray ?? [2];

  const combinations = getCombination(filesList, denoising, upscaling);

  for await (const combination of combinations) {
    const query = await prepareQuery(combination.file, combination.scaleFactor, combination.denoising_strength);

    if (query) {
      const { baseParams } = query;

      if (checkpoint) {
        baseParams.override_settings.sd_model_checkpoint = checkpoint;
      }

      queries.push(baseParams);
    }
  }

  for await (const queryParams of queries) {
    await renderQuery(queryParams, 'img2img');
  }
};
